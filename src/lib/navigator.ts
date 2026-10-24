export type Answers = Record<string, string>;
type Opt = { value: string; label: string };
export type Question = { id: string; section: string; text: string; help?: string; options: Opt[]; showIf?: (a: Answers) => boolean };

const unsure: Opt = { value: "unsure", label: "I'm not sure" };
const skip: Opt = { value: "skip", label: "Prefer not to answer" };
const yn = (extra: Opt = unsure): Opt[] => [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, extra];

export const QUESTIONS: Question[] = [
  { id: "for", section: "About you", text: "Who is the ride for?", options: [{ value: "me", label: "Me" }, { value: "child", label: "My child" }, { value: "other", label: "Someone I help care for" }] },
  { id: "age", section: "About you", text: "How old is the person who needs the ride?", options: [{ value: "child", label: "Under 18" }, { value: "adult", label: "18 to 59" }, { value: "senior", label: "60 or older" }, skip] },
  { id: "detroit", section: "About you", text: "Do they live in the City of Detroit?", help: "Not nearby cities like Dearborn or Southfield.", options: yn() },
  { id: "language", section: "Language", text: "What language is easiest to talk on the phone in?", options: [{ value: "en", label: "English" }, { value: "es", label: "Español (Spanish)" }, { value: "ar", label: "العربية (Arabic)" }, { value: "bn", label: "বাংলা (Bengali)" }, { value: "other", label: "Another language" }] },
  { id: "hearing", section: "Language", text: "Is it hard to hear or speak on phone calls?", options: yn(skip) },
  { id: "phone", section: "Language", text: "Can they make phone calls to book a ride?", options: [{ value: "yes", label: "Yes" }, { value: "limited", label: "Only sometimes" }, { value: "no", label: "No working phone" }] },
  { id: "insurance", section: "Insurance", text: "What health insurance do they have?", help: "Check the card in the wallet. It usually names the plan.", options: [{ value: "medicaid", label: "Medicaid / Healthy Michigan" }, { value: "medicare", label: "Medicare" }, { value: "both", label: "Both Medicaid and Medicare" }, { value: "private", label: "Private / work insurance" }, { value: "uninsured", label: "No insurance" }, unsure] },
  { id: "card", section: "Insurance", text: "Do they have their insurance card with them?", help: "Rides through Medicaid are booked using the phone number on the back of the card.", showIf: (a) => isMedicaid(a), options: yn() },
  { id: "timing", section: "Appointment", text: "When is the appointment?", options: [{ value: "today", label: "Today" }, { value: "1-2", label: "Tomorrow or in 2 days" }, { value: "3-6", label: "3 to 6 days away" }, { value: "7+", label: "A week or more away" }, unsure] },
  { id: "time", section: "Appointment", text: "What time is the appointment?", options: [{ value: "weekday-day", label: "Weekday, 8 am – 4 pm" }, { value: "weekday-late", label: "Weekday, 4 – 6 pm" }, { value: "saturday", label: "Saturday" }, { value: "off-hours", label: "Evening, night, or Sunday" }, unsure] },
  { id: "kind", section: "Appointment", text: "What kind of visit is it?", options: [{ value: "medical", label: "Doctor or clinic" }, { value: "dialysis", label: "Dialysis or regular treatment" }, { value: "pharmacy", label: "Pharmacy" }, { value: "dental", label: "Dental" }, { value: "behavioral", label: "Mental health or recovery" }, skip] },
  { id: "pregnant", section: "Appointment", text: "Is this for a pregnancy or a baby's checkup?", options: yn(skip) },
  { id: "mobility", section: "Getting around", text: "What help do they need to get in a vehicle?", options: [{ value: "wheelchair", label: "Uses a wheelchair or scooter" }, { value: "walker", label: "Uses a walker or cane" }, { value: "none", label: "No help needed" }, unsure] },
  { id: "bus", section: "Getting around", text: "Can they ride a regular city bus on their own?", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No, because of a disability" }, unsure] },
  { id: "certified", section: "Getting around", text: "Are they already approved for DDOT Paratransit (MetroLift)?", showIf: (a) => a["bus"] !== "yes", options: yn() },
  { id: "companion", section: "Getting around", text: "Does someone need to ride along?", options: [{ value: "yes", label: "Yes, a helper or parent" }, { value: "no", label: "No" }, unsure] },
  { id: "cost", section: "Getting around", text: "Can they pay about $2.50 cash for each ride?", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, unsure] },
];

export const isMedicaid = (a: Answers) => ["medicaid", "both"].includes(a["insurance"] ?? "");
export const visibleQuestions = (a: Answers) => QUESTIONS.filter((q) => !q.showIf || q.showIf(a));

export const CHECKED = "Oct 24, 2026";
export type Program = { id: string; name: string; offers: string; contact: string; phone?: string; source: string };

// Screens read this simple view; the source of truth is the HSDS 3.0 records in hsds.ts.
const toProgram = (id: string): Program => {
  const s = service(id);
  const tel = s.phones.find((p) => p.type !== "tty")?.number.replace(/\D/g, "");
  return { id: s.id, name: s.name, offers: s.description, contact: s.application_process ?? "Contact the program to confirm.", ...(tel && id !== "medicaid" ? { phone: tel } : {}), source: s.url ?? s.organization.website ?? "" };
};

export const PROGRAMS = {
  medicaid: toProgram("medicaid"),
  daaa: toProgram("daaa"),
  paratransit: toProgram("paratransit"),
  ddotnow: toProgram("ddotnow"),
  baby: toProgram("baby"),
  uw211: toProgram("uw211"),
};

/** Which HSDS 3.0 field each intake question is compared against when matching. */
export const HSDS_MAP: Record<string, string> = {
  for: "(intake only — not an HSDS field)",
  age: "service.minimum_age / maximum_age",
  detroit: "service.service_areas",
  language: "service.languages, service.interpretation_services",
  hearing: "service.phones[type=tty]",
  phone: "service.phones",
  insurance: "service.eligibility_description",
  card: "service.required_documents",
  timing: "service.application_process (advance notice)",
  time: "service.schedules (byday, opens_at, closes_at)",
  kind: "service.description",
  pregnant: "service.eligibility_description",
  mobility: "location.accessibility",
  bus: "service.eligibility_description",
  certified: "service.application_process",
  companion: "service.description",
  cost: "service.cost_options, service.fees_description",
};

/** The patient's answers as a portable record, keyed by question and the HSDS field each relates to. Stays on the device. */
export const intakeExport = (a: Answers) => ({
  format: "Detroit Ride Navigator intake, mapped to Open Referral HSDS 3.0 service fields",
  created: new Date().toISOString(),
  answers: visibleQuestions(a).map((q) => ({ question_id: q.id, question: q.text, answer: a[q.id] ?? null, hsds_field: HSDS_MAP[q.id] ?? null })),
});

export type Result = { program: Program; reasons: string[]; confirm: string[] };
const v = (a: Answers, k: string) => a[k] ?? "";

export function matchPrograms(a: Answers): Result[] {
  const out: Result[] = [];
  const today = v(a, "timing") === "today";
  const disabled = v(a, "bus") === "no" || v(a, "mobility") === "wheelchair";
  const maybeDetroit = v(a, "detroit") !== "no";
  const detroitConfirm = v(a, "detroit") === "unsure" ? ["That the home address is inside Detroit."] : [];

  if (isMedicaid(a) || v(a, "insurance") === "unsure") {
    const confirm: string[] = ["How many days ahead your plan needs you to call."];
    if (v(a, "insurance") === "unsure") confirm.unshift("Whether they have Medicaid — check the card.");
    if (today) confirm.unshift("Same-day rides are usually not possible — call anyway and ask.");
    if (v(a, "mobility") === "wheelchair") confirm.push("Ask for a wheelchair-accessible vehicle.");
    if (v(a, "companion") === "yes") confirm.push("Whether a helper can ride along.");
    out.push({ program: PROGRAMS.medicaid, reasons: ["Serves people with Medicaid or a Medicaid Health Plan"], confirm });
  }

  const age = v(a, "age");
  if (maybeDetroit && (age === "senior" || disabled) && !today && v(a, "time") !== "off-hours") {
    const confirm = [...detroitConfirm];
    if (v(a, "timing") === "1-2" || v(a, "timing") === "unsure") confirm.push("New riders need 3 working days to register — ask if there's time.");
    if (v(a, "time") === "saturday") confirm.push("Saturday rides end at 4 pm.");
    if (v(a, "time") === "unsure") confirm.push("That the visit is within service hours.");
    if (disabled && age !== "senior") confirm.push("Disability may need to be verified.");
    out.push({ program: PROGRAMS.daaa, reasons: [age === "senior" ? "Serves Detroit residents 60 and older" : "Serves Detroit residents with a disability"], confirm });
  }

  if (maybeDetroit && disabled) {
    const certified = v(a, "certified") === "yes";
    const confirm = [...detroitConfirm, "That pickup and drop-off are within ¾ mile of a DDOT bus route (call 313-774-5555)."];
    if (!certified) confirm.unshift("Must apply and be approved before riding — this takes time.");
    if (!today) out.push({ program: PROGRAMS.paratransit, reasons: ["For people who can't use a regular bus because of a disability"], confirm });
    if (certified || today) out.push({ program: PROGRAMS.ddotnow, reasons: ["Can be booked the same day"], confirm: ["Who can use DDOT Now — contact the program to confirm.", "A ride is not guaranteed."] });
  }

  if (v(a, "pregnant") === "yes") out.push({ program: PROGRAMS.baby, reasons: ["For pregnancy or a baby's appointment"], confirm: ["What ride help is available for your date."] });

  out.push({ program: PROGRAMS.uw211, reasons: ["Open to anyone — a backup if other options don't work"], confirm: ["Whether you qualify for a free or discounted ride."] });
  return out;
}

export function accessNotes(a: Answers): string[] {
  const n: string[] = [];
  const lang = v(a, "language");
  if (lang && lang !== "en") n.push("When you call, say the name of your language and ask for an interpreter. Each program's language help isn't listed — ask to confirm.");
  if (lang === "es" || lang === "ar") n.push("DDOT Paratransit applications come in Spanish and Arabic.");
  if (v(a, "hearing") === "yes") n.push("Call through relay service by dialing 711. Blue Cross Complete lists TTY 711.");
  if (v(a, "phone") !== "yes") n.push("No reliable phone? Ask the clinic front desk or a social worker to call for you.");
  if (v(a, "cost") !== "yes") n.push("Some rides cost $2.50 cash. Ask 2-1-1 or your clinic about free options.");
  if (v(a, "time") === "off-hours") n.push("Evening and Sunday rides are harder to find. Ask the clinic if an earlier time is possible.");
  return n;
}

export const READY_LIST = ["Insurance card (front and back)", "Appointment date, time, clinic name and address", "Clinic phone number", "Pickup address", "Mobility needs (wheelchair, walker, helper riding along)", "$2.50 exact change, if the ride has a fare"];
export const CALL_SCRIPT = "Hi, I need a ride to a medical appointment on [date] at [time] at [clinic address]. Can I use your service, and how do I book?";
