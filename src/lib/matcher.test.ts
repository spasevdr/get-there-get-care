import { describe, it, expect } from "vitest";
import { db } from "./db";
import { matchPrograms, checkScenario } from "./matcher";
import { cleanAnswers, QUESTIONS, HSDS_MAP } from "./questions";

const ids = (a: Record<string, string | null>) => { const r = matchPrograms(a, db); return [...r.options, ...r.apply, ...r.backup].map((m) => m.service.id); };
const base = db.test_scenarios[0]!.answers;

describe("test scenarios", () => {
  db.test_scenarios.forEach((sc) => it(sc.name, () => expect(checkScenario(sc, db).fails).toEqual([])));
});

describe("key rules", () => {
  it("DAAA never shows for evening or Sunday", () => expect(ids({ ...base, appointment_time: "evening_night_sunday" })).not.toContain("svc_daaa"));
  it("only same-day services show for today", () => {
    const r = matchPrograms({ ...base, appointment_when: "today" }, db);
    r.options.forEach((m) => expect(m.service.booking.same_day_possible).toBe(true));
  });
  it("suburban ZIP + not in Detroit hides Detroit-only programs", () => {
    const r = ids({ ...base, lives_in_detroit: "no", zip: "48075" });
    db.services.filter((s) => s.eligibility.residency_required === "detroit").forEach((s) => expect(r).not.toContain(s.id));
  });
  it("MetroLift goes to Apply when not certified", () => {
    const r = matchPrograms({ ...base, paratransit_approved: "no" }, db);
    expect(r.apply.map((m) => m.service.id)).toContain("svc_metrolift");
  });
  it("2-1-1 is in every result", () => db.test_scenarios.forEach((sc) => expect(matchPrograms(sc.answers, db).backup.map((m) => m.service.id)).toContain("svc_211")));
  it("hidden Medicaid plan answer is ignored after switching insurance", () => expect(cleanAnswers({ ...base, insurance: "private" }).medicaid_plan).toBeNull());
  it("every question maps to an HSDS field", () => QUESTIONS.forEach((q) => expect(HSDS_MAP[q.id]).toBeTruthy()));
});
