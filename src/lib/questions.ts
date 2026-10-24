import type { Answers } from "./db";

type Opt = { value: string; label: string };
export type Question = { id: string; section: string; text: string; help?: string; kind?: "zip"; options: Opt[]; showIf?: (a: Answers) => boolean };

const ns: Opt = { value: "not_sure", label: "I'm not sure" };
const pn: Opt = { value: "prefer_not", label: "Prefer not to answer" };
const yn = (extra: Opt = ns): Opt[] => [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, extra];
export const isMedicaid = (a: Answers) => a.insurance === "medicaid" || a.insurance === "both";

export const QUESTIONS: Question[] = [
  { id: "rider_for", section: "About you", text: "Who is the ride for?", options: [{ value: "me", label: "Me" }, { value: "child", label: "My child" }, { value: "cared_person", label: "Someone I help care for" }] },
  { id: "age_band", section: "About you", text: "How old is the person who needs the ride?", options: [{ value: "under_18", label: "Under 18" }, { value: "18_59", label: "18 to 59" }, { value: "60_plus", label: "60 or older" }, pn] },
  { id: "lives_in_detroit", section: "About you", text: "Do they live in the City of Detroit?", help: "Not nearby cities like Dearborn or Southfield.", options: yn() },
  { id: "zip", section: "About you", kind: "zip", text: "ZIP code where the ride starts", help: "Optional. Just the 5-digit ZIP — not a street address.", options: [] },
  { id: "language", section: "Language", text: "What language is easiest to talk on the phone in?", options: [{ value: "english", label: "English" }, { value: "spanish", label: "Español (Spanish)" }, { value: "arabic", label: "العربية (Arabic)" }, { value: "bengali", label: "বাংলা (Bengali)" }, { value: "other", label: "Another language" }] },
  { id: "hearing_speech_difficulty", section: "Language", text: "Is it hard to hear or speak on phone calls?", options: yn(pn) },
  { id: "can_make_calls", section: "Language", text: "Can they make phone calls to book a ride?", options: [{ value: "yes", label: "Yes" }, { value: "sometimes", label: "Only sometimes" }, { value: "no_phone", label: "No working phone" }] },
  { id: "insurance", section: "Insurance", text: "What health insurance do they have?", help: "Check the card in the wallet. It usually names the plan.", options: [{ value: "medicaid", label: "Medicaid / Healthy Michigan" }, { value: "medicare", label: "Medicare" }, { value: "both", label: "Both Medicaid and Medicare" }, { value: "private", label: "Private / work insurance" }, { value: "none", label: "No insurance" }, ns] },
  { id: "medicaid_plan", section: "Insurance", text: "Which Medicaid health plan?", help: "The plan name is on the front of the card.", showIf: isMedicaid, options: [{ value: "bcc", label: "Blue Cross Complete" }, { value: "meridian", label: "Meridian" }, { value: "molina", label: "Molina" }, { value: "hap_caresource", label: "HAP CareSource" }, { value: "priority", label: "Priority Health" }, { value: "uhc", label: "UnitedHealthcare" }, { value: "aetna", label: "Aetna Better Health" }, { value: "not_sure", label: "Not sure" }] },
  { id: "has_insurance_card", section: "Insurance", text: "Do they have their insurance card with them?", help: "Medicaid rides are booked using the phone number on the back of the card.", showIf: isMedicaid, options: yn() },
  { id: "appointment_when", section: "Appointment", text: "When is the appointment?", options: [{ value: "today", label: "Today" }, { value: "1_2_days", label: "Tomorrow or in 2 days" }, { value: "3_6_days", label: "3 to 6 days away" }, { value: "7_plus_days", label: "A week or more away" }, ns] },
  { id: "appointment_time", section: "Appointment", text: "What time is the appointment?", options: [{ value: "weekday_8_4", label: "Weekday, 8 am – 4 pm" }, { value: "weekday_4_6", label: "Weekday, 4 – 6 pm" }, { value: "saturday", label: "Saturday" }, { value: "evening_night_sunday", label: "Evening, night, or Sunday" }, ns] },
  { id: "visit_type", section: "Appointment", text: "What kind of visit is it?", options: [{ value: "doctor", label: "Doctor or clinic" }, { value: "dialysis", label: "Dialysis or regular treatment" }, { value: "pharmacy", label: "Pharmacy" }, { value: "dental", label: "Dental" }, { value: "mental_health", label: "Mental health or recovery" }, pn] },
  { id: "pregnancy_infant", section: "Appointment", text: "Is this for a pregnancy or a baby's checkup?", options: yn(pn) },
  { id: "mobility", section: "Getting around", text: "What help do they need to get in a vehicle?", options: [{ value: "wheelchair_scooter", label: "Uses a wheelchair or scooter" }, { value: "walker_cane", label: "Uses a walker or cane" }, { value: "none", label: "No help needed" }, ns] },
  { id: "can_ride_bus_alone", section: "Getting around", text: "Can they ride a regular city bus on their own?", options: [{ value: "yes", label: "Yes" }, { value: "no_disability", label: "No, because of a disability" }, ns] },
  { id: "paratransit_approved", section: "Getting around", text: "Are they already approved for DDOT Paratransit (MetroLift)?", showIf: (a) => a.can_ride_bus_alone === "no_disability", options: yn() },
  { id: "helper_riding", section: "Getting around", text: "Does someone need to ride along?", options: [{ value: "yes", label: "Yes, a helper or parent" }, { value: "no", label: "No" }, ns] },
  { id: "can_pay_fare", section: "Getting around", text: "Can they pay about $2–$2.50 cash for each ride?", options: yn() },
];

export const visibleQuestions = (a: Answers) => QUESTIONS.filter((q) => !q.showIf || q.showIf(a));
/** Drops answers to questions that are now hidden, so stale picks never affect matching. */
export const cleanAnswers = (a: Answers): Answers => Object.fromEntries(QUESTIONS.map((q) => [q.id, visibleQuestions(a).includes(q) ? a[q.id] ?? null : null]));

/** Which HSDS 3.0 field each question is compared against. */
export const HSDS_MAP: Record<string, string> = {
  rider_for: "(intake only — not an HSDS field)",
  age_band: "service.minimum_age / maximum_age",
  lives_in_detroit: "service.service_areas",
  zip: "service_area.extent (postal code)",
  language: "service.languages, service.interpretation_services",
  hearing_speech_difficulty: "service.phones[type=tty]",
  can_make_calls: "service.phones",
  insurance: "service.eligibility_description",
  medicaid_plan: "service.organization",
  has_insurance_card: "service.required_documents",
  appointment_when: "service.application_process (advance notice)",
  appointment_time: "service.schedules",
  visit_type: "service.description",
  pregnancy_infant: "service.eligibility_description",
  mobility: "location.accessibility",
  can_ride_bus_alone: "service.eligibility_description",
  paratransit_approved: "service.application_process",
  helper_riding: "service.description",
  can_pay_fare: "service.cost_options",
};

export const intakeExport = (a: Answers) => ({
  format: "Detroit Ride Navigator intake (FHIR QuestionnaireResponse-style), mapped to Open Referral HSDS 3.0 fields",
  created: new Date().toISOString(),
  answers: visibleQuestions(a).map((q) => ({ question_id: q.id, question: q.text, answer: a[q.id] ?? null, hsds_field: HSDS_MAP[q.id] ?? null })),
});
