export type Answer = string;
export type Answers = Record<string, Answer>;

export type Question = { id: string; text: string; help?: string; options: { value: string; label: string }[] };

const unsure = { value: "unsure", label: "I'm not sure" };

export const QUESTIONS: Question[] = [
  { id: "detroit", text: "Do you live in the City of Detroit?", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, unsure] },
  {
    id: "insurance",
    text: "What kind of health insurance do you have?",
    help: "Look at the card in your wallet. It usually names the plan.",
    options: [
      { value: "medicaid", label: "Medicaid" },
      { value: "medicare", label: "Medicare" },
      { value: "private", label: "Private / work insurance" },
      { value: "uninsured", label: "No insurance" },
      unsure,
    ],
  },
  {
    id: "timing",
    text: "When is your appointment?",
    options: [
      { value: "today", label: "Today" },
      { value: "week", label: "Within a week" },
      { value: "later", label: "Later than a week" },
      unsure,
    ],
  },
  { id: "wheelchair", text: "Do you need a wheelchair-accessible vehicle?", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, unsure] },
  { id: "senior", text: "Are you 60 or older?", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "skip", label: "Prefer not to answer" }] },
  {
    id: "family",
    text: "Is the ride for a pregnancy or a baby's appointment?",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "skip", label: "Prefer not to answer" }],
  },
];

export type Program = { id: string; name: string; offers: string; contact: string; source: string; checked: string };

export const PROGRAMS: Program[] = [
  { id: "plan", name: "Demo Health Plan Rides", offers: "Free rides to medical visits for members of a Medicaid health plan. Book at least 2 days ahead.", contact: "Call the member services number on the back of your insurance card.", source: "Demo data — no real link", checked: "Demo" },
  { id: "van", name: "Demo Accessible Van Service", offers: "Wheelchair-accessible rides inside Detroit. Book 1 day ahead.", contact: "Demo program — no real phone number.", source: "Demo data — no real link", checked: "Demo" },
  { id: "community", name: "Demo Community Ride Circle", offers: "Volunteer rides for Detroit residents 60+ and for pregnancy or infant visits.", contact: "Demo program — no real phone number.", source: "Demo data — no real link", checked: "Demo" },
];

export type Result = { program: Program; reasons: string[]; confirm: string[] };

const is = (a: Answers, k: string, v: string) => a[k] === v;
const maybe = (a: Answers, k: string, v: string) => a[k] === v || a[k] === "unsure";

export function matchPrograms(a: Answers): Result[] {
  const out: Result[] = [];
  const timingOk = (minDays: number) => (a.timing === "today" ? false : true) && minDays >= 0;

  // Plan rides: Medicaid, needs 2+ days notice
  if (maybe(a, "insurance", "medicaid") && timingOk(2)) {
    const confirm: string[] = [];
    if (is(a, "insurance", "unsure")) confirm.push("Whether you have Medicaid — check your card.");
    if (is(a, "timing", "unsure") || is(a, "timing", "week")) confirm.push("That your appointment is at least 2 days away.");
    if (!is(a, "wheelchair", "no")) confirm.push("Whether a wheelchair-accessible vehicle is available.");
    out.push({ program: PROGRAMS[0], reasons: ["Serves Medicaid members", "Your appointment may allow time to book"], confirm });
  }

  // Accessible van: Detroit + wheelchair, 1 day notice
  if (maybe(a, "detroit", "yes") && maybe(a, "wheelchair", "yes") && a.timing !== "today") {
    const confirm: string[] = [];
    if (is(a, "detroit", "unsure")) confirm.push("That your home is inside Detroit city limits.");
    if (is(a, "wheelchair", "unsure")) confirm.push("Your mobility needs with the program.");
    out.push({ program: PROGRAMS[1], reasons: ["Offers wheelchair-accessible rides in Detroit"], confirm });
  }

  // Community rides: Detroit + (60+ or family)
  if (maybe(a, "detroit", "yes") && (is(a, "senior", "yes") || is(a, "family", "yes"))) {
    const confirm: string[] = [];
    if (is(a, "detroit", "unsure")) confirm.push("That your home is inside Detroit city limits.");
    confirm.push("Volunteer availability for your date.");
    const reasons = [is(a, "senior", "yes") ? "Serves residents 60 and older" : "Serves pregnancy and infant visits"];
    out.push({ program: PROGRAMS[2], reasons, confirm });
  }
  return out;
}

export const READY_LIST = [
  "Your insurance card",
  "Appointment date, time, and clinic address",
  "Your doctor's or clinic's name and phone",
  "Your pickup address",
  "Any mobility needs (wheelchair, walker, helper riding along)",
];

export const CALL_SCRIPT =
  "Hi, I need a ride to a medical appointment on [date] at [time]. It's at [clinic address]. Can you tell me if I can use your service and how to book?";
