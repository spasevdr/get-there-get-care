import type { Answers, Db, Service } from "./db";

export type Tier = "Strong potential" | "Possible — needs confirming" | "Backup";
export type Match = { service: Service; score: number; tier: Tier; reasons: string[]; confirms: string[] };
export type MatchResult = { options: Match[]; apply: Match[]; backup: Match[] };

const LEAD: Record<string, number | null> = { today: 4, "1_2_days": 48, "3_6_days": 96, "7_plus_days": 240, not_sure: null };
const AGE: Record<string, number | null> = { under_18: 10, "18_59": 30, "60_plus": 65, prefer_not: null };
const LANG: Record<string, string> = { spanish: "Spanish", arabic: "Arabic", bengali: "Bengali", other: "your language" };

export const tierOf = (s: number): Tier => (s >= 70 ? "Strong potential" : s >= 45 ? "Possible — needs confirming" : "Backup");

function miles(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

export const findZip = (db: Db, zip: string | null | undefined) => (zip ? db.zip_areas.find((z) => z.zip === zip) ?? null : null);

/** Pure, deterministic. A definite "No" can exclude; "Not sure" only adds a confirm line and lowers the score. */
export function matchPrograms(a: Answers, db: Db): MatchResult {
  const out: MatchResult = { options: [], apply: [], backup: [] };
  const z = findZip(db, a.zip);
  const lead = a.appointment_when ? LEAD[a.appointment_when] ?? null : null;
  const age = a.age_band ? AGE[a.age_band] ?? null : null;
  const hasDisability = a.can_ride_bus_alone === "no_disability" || a.mobility === "wheelchair_scooter" || a.mobility === "walker_cane";
  const medicaidIns = a.insurance === "medicaid" || a.insurance === "both";

  for (const s of db.services) {
    let score = 50;
    const reasons: string[] = [];
    const confirms = [...s.confirm_items];
    const conf = (t: string, d = 0) => { confirms.push(t); score += d; };
    const done = (where: keyof MatchResult, extra: string[] = []) => {
      score = Math.max(0, Math.min(100, score));
      out[where].push({ service: s, score, tier: tierOf(score), reasons: [s.why_fit_template, ...extra, ...reasons], confirms: [...new Set(confirms)] });
    };

    // Rule 0
    if (s.always_show) { done("backup"); continue; }

    // Rule 1 — geography
    const c = s.coverage;
    let inArea: boolean | null;
    if (c.type === "statewide") inArea = true;
    else if (!z) inArea = null;
    else if (c.excludes_city_of_detroit && z.in_city_of_detroit) inArea = false;
    else if (c.type === "zip_list") inArea = c.zips.includes(z.zip);
    else if (c.type === "county_list") inArea = c.counties.includes(z.county);
    else inArea = miles(z.lat, z.lng, c.center_lat!, c.center_lng!) <= c.radius_miles!;
    if (inArea === false) continue;
    if (inArea === null) {
      if (c.neighborhood_scope) continue;
      if (c.excludes_city_of_detroit && a.lives_in_detroit === "yes") continue;
    }
    if (inArea === null || c.type === "statewide") {
      const res = s.eligibility.residency_required;
      if (res === "detroit") {
        if (a.lives_in_detroit === "no") continue;
        if (a.lives_in_detroit === "yes") score += 10; else conf("Confirm you live in the City of Detroit", -10);
      } else if (res && a.lives_in_detroit !== "yes" && inArea === null) conf("Confirm your home is inside the program's service area", -5);
    } else if (z) { score += 10; reasons.push(`Serves ZIP ${z.zip} (${z.area_label})`); }

    // Rule 2 — appointment time
    const t = a.appointment_time;
    if (t && t !== "not_sure" && !s.time_slots_served.includes(t as never)) continue;
    if (t === "not_sure" && s.time_slots_served.length < 4) conf("Confirm the program runs at your appointment time");

    // Rule 3 — lead time
    if (lead !== null) {
      if (s.booking.min_notice_hours > lead) continue;
      if (a.appointment_when === "today") {
        if (!s.booking.same_day_possible) continue;
        score += 5; reasons.push("Can sometimes be arranged the same day");
      }
      if (a.appointment_when === "1_2_days" && s.booking.min_notice_hours >= 24) conf("Timing is tight — call right away", -5);
    } else if (a.appointment_when === "not_sure") conf("Check how many days' notice the program needs");

    // Rule 4 — visit type
    if (!s.visit_types.includes("any")) {
      const vt = a.visit_type;
      if (vt === "prefer_not" || !vt) conf("Confirm this type of visit is covered");
      else if (!s.visit_types.includes(vt as never)) continue;
      else if (s.visit_types.length <= 2) { score += 10; reasons.push("Specializes in this kind of visit"); }
    }

    // Rule 5 — age and disability
    const e = s.eligibility;
    const ageOk = age !== null && (e.age_min === null || age >= e.age_min) && (e.age_max === null || age <= e.age_max);
    if (e.age_min !== null || e.age_max !== null) {
      if (e.age_or_disability) {
        if (ageOk) score += 10;
        else if (hasDisability) { score += 5; reasons.push("May qualify through the disability rule"); }
        else if (age === null || a.mobility === "not_sure" || a.can_ride_bus_alone === "not_sure") conf("Confirm you meet the age or disability rule", -10);
        else continue;
      } else if (age === null) conf("Confirm you meet the age rule", -5);
      else if (!ageOk) continue;
    }
    if (e.requires_disability && !e.requires_paratransit_certification && !hasDisability) {
      if (a.mobility === "not_sure" || a.can_ride_bus_alone === "not_sure" || !a.mobility) conf("Confirm the disability rule for this program");
      else continue;
    }

    // Rule 6 — paratransit certification
    let toApply = false;
    if (e.requires_paratransit_certification) {
      if (a.can_ride_bus_alone === "yes") continue;
      if (a.paratransit_approved === "yes") { score += 20; reasons.push("You are already certified"); }
      else if (a.paratransit_approved === "no") { if (!s.show_as_apply_if_not_certified) continue; toApply = true; }
      else conf("Confirm whether you are certified for paratransit", -10);
    }

    // Rule 7 — insurance
    const ins = e.insurance_accepted;
    if (!ins.includes("any")) {
      if (a.insurance === "not_sure" || !a.insurance) conf("Confirm your insurance type (ask the clinic to check)", -10);
      else if (!ins.includes(a.insurance as never)) continue;
      else { score += 15; reasons.push("Matches your insurance"); }
    }
    const plan = a.medicaid_plan ?? null;
    if (e.medicaid_plan_code && plan !== e.medicaid_plan_code) continue;
    if (s.organization_id === "org_mhp" && plan !== null && plan !== "not_sure") continue;
    const isMedicaidSvc = ins.includes("medicaid");
    if (isMedicaidSvc && medicaidIns && (a.has_insurance_card === "no" || a.has_insurance_card === "not_sure")) conf("No card? Ask the clinic to look up your plan name first", -5);

    // Rule 8 — mobility
    const wc = s.accessibility.wheelchair_accessible;
    if (a.mobility === "wheelchair_scooter") {
      if (wc === false) continue;
      if (wc === null) conf("Confirm a wheelchair-accessible vehicle is available", -5); else score += 10;
    } else if (a.mobility === "not_sure" && wc === false) conf("Vehicles are not wheelchair accessible");

    // Rule 9 — fixed-route bus
    if (s.service_mode === "bus") {
      if (a.can_ride_bus_alone === "no_disability") continue;
      if (a.can_ride_bus_alone === "not_sure") conf("Only if you are comfortable riding the bus alone", -10);
      else if (a.can_ride_bus_alone === "yes") score += 5;
    }

    // Rule 10 — pregnancy/infant
    if (e.pregnancy_infant_focus) { if (a.pregnancy_infant !== "yes") continue; score += 15; }

    // Rule 11 — patient-of-org / referral
    if (e.requires_patient_of_org) { confirms.unshift("Only if your appointment is with this health system"); score -= 15; }
    if (e.requires_referral) {
      if (a.can_make_calls === "no_phone") { score += 10; reasons.push("Your clinic can book this for you — no phone needed"); } else score -= 5;
    }

    // Rule 12 — helper
    if (a.helper_riding === "yes") {
      const esc = s.accessibility.escort_allowed;
      if (esc === false) continue;
      if (esc === null) conf("Ask whether a helper can ride along"); else score += 3;
    }

    // Rule 13 — fare
    if (a.can_pay_fare === "no" || a.can_pay_fare === "not_sure") {
      if (s.fare.amount_usd > 0) conf("Ask about fare waivers or vouchers", -10);
      else { score += 10; reasons.push("Free"); }
    }

    // Rule 14 — language
    const lang = a.language;
    if (lang && lang !== "english") {
      if (s.accessibility.languages.includes(lang as never)) { score += 10; reasons.push(`Staff who speak ${LANG[lang] ?? lang}`); }
      else if (s.accessibility.interpreter_on_request) conf("Ask for an interpreter when you call");
      else conf("English only — bring someone who can help you call", -5);
    }

    // Rule 15 — no phone
    if (a.can_make_calls === "no_phone" && !s.accessibility.online_booking && !e.requires_referral) conf("Ask the clinic to make this call for you");

    // Rule 16 — data status
    if (s.data_status !== "verified_from_source") score -= 5;

    if (toApply) done("apply", ["Not for this appointment — apply now for future rides"]);
    else done("options");
  }
  out.options.sort((x, y) => y.score - x.score);
  return out;
}

const TIP_RULES: Record<string, (a: Answers, db: Db) => boolean> = {
  today: (a) => a.appointment_when === "today",
  evening: (a) => a.appointment_time === "evening_night_sunday",
  interpreter: (a) => !!a.language && a.language !== "english",
  paratransit_lang: (a) => a.language === "spanish" || a.language === "arabic",
  relay: (a) => a.hearing_speech_difficulty === "yes",
  no_phone: (a) => a.can_make_calls === "sometimes" || a.can_make_calls === "no_phone",
  fare: (a) => a.can_pay_fare === "no" || a.can_pay_fare === "not_sure",
  no_card: (a) => (a.insurance === "medicaid" || a.insurance === "both") && (a.has_insurance_card === "no" || a.has_insurance_card === "not_sure"),
  zip_unknown: (a, db) => !!a.zip && !findZip(db, a.zip),
  helper: (a) => a.helper_riding === "yes",
  wheelchair: (a) => a.mobility === "wheelchair_scooter",
  apply_paratransit: (a) => a.paratransit_approved === "no",
};
export const activeTips = (a: Answers, db: Db) => db.tips.filter((t) => TIP_RULES[t.id]?.(a, db));

export function checkScenario(sc: Db["test_scenarios"][number], db: Db) {
  const r = matchPrograms(sc.answers, db);
  const all = [...r.options, ...r.apply, ...r.backup].map((m) => m.service.id);
  const apply = r.apply.map((m) => m.service.id);
  const tips = activeTips(sc.answers, db).map((t) => t.id);
  const fails = [
    ...sc.expect.must_include.filter((id) => !all.includes(id)).map((id) => `missing ${id}`),
    ...sc.expect.must_exclude.filter((id) => all.includes(id)).map((id) => `should not show ${id}`),
    ...sc.expect.apply_section.filter((id) => !apply.includes(id)).map((id) => `${id} not in Apply`),
    ...sc.expect.tips_include.filter((id) => !tips.includes(id)).map((id) => `tip ${id} missing`),
  ];
  return { pass: fails.length === 0, fails };
}
