import raw from "@/data/programs.json";

// Shapes follow Open Referral HSDS 3.0 naming (organization → service → phone/schedule/service_area).
// Each Service maps to a FHIR HealthcareService; the rider's answers map to a FHIR QuestionnaireResponse.
export type Slot = "weekday_8_4" | "weekday_4_6" | "saturday" | "evening_night_sunday";
export type Visit = "doctor" | "dialysis" | "pharmacy" | "dental" | "mental_health" | "any";
export type Insurance = "medicaid" | "medicare" | "both" | "private" | "none" | "any";
export type DataStatus = "verified_from_source" | "placeholder_real_org" | "synthetic";
export type Lang = "english" | "spanish" | "arabic" | "bengali" | "other";

export interface Service {
  id: string; organization_id: string; name: string;
  program_type: "ride" | "transit" | "info_referral";
  service_mode: "curb_to_curb" | "door_to_door" | "bus" | "on_demand" | "rideshare_voucher" | "volunteer_driver" | "info_referral";
  data_status: DataStatus;
  date_checked: string; source_url: string | null;
  offers: string;
  fare: { amount_usd: number; note: string | null };
  booking: { min_notice_hours: number; max_advance_days: number; same_day_possible: boolean; note: string | null };
  time_slots_served: Slot[];
  visit_types: Visit[];
  eligibility: {
    age_min: number | null; age_max: number | null; age_or_disability: boolean;
    residency_required: "detroit" | "wayne" | "tri_county" | null;
    insurance_accepted: Insurance[];
    medicaid_plan_code: string | null;
    requires_disability: boolean; requires_paratransit_certification: boolean;
    pregnancy_infant_focus: boolean; requires_patient_of_org: boolean; requires_referral: boolean;
    within_miles_of_bus_route: number | null;
  };
  accessibility: { wheelchair_accessible: boolean | null; escort_allowed: boolean | null; languages: Lang[]; tty_or_relay: "711" | null; interpreter_on_request: boolean | null; online_booking: boolean };
  coverage: { type: "statewide" | "zip_list" | "county_list" | "radius"; zips: string[]; counties: string[]; center_lat: number | null; center_lng: number | null; radius_miles: number | null; excludes_city_of_detroit: boolean; neighborhood_scope: boolean };
  contact: { phone: string | null; phone_display: string | null; tty: string | null; url: string | null; call_hours_note: string | null };
  confirm_items: string[];
  why_fit_template: string;
  same_day_role: "primary" | "backup" | null;
  always_show: boolean;
  show_as_apply_if_not_certified: boolean;
}
export interface ZipArea { zip: string; city: string; county: string; in_city_of_detroit: boolean; lat: number; lng: number; area_label: string }
export interface Organization { id: string; name: string; org_type: string; is_501c3: boolean; data_status: DataStatus }
export interface Tip { id: string; trigger: string; text: string }
export type AnswerKey = "rider_for" | "age_band" | "lives_in_detroit" | "zip" | "language" | "hearing_speech_difficulty" | "can_make_calls" | "insurance" | "medicaid_plan" | "has_insurance_card" | "appointment_when" | "appointment_time" | "visit_type" | "pregnancy_infant" | "mobility" | "can_ride_bus_alone" | "paratransit_approved" | "helper_riding" | "can_pay_fare";
export type Answers = { [K in AnswerKey]?: string | null } & Record<string, string | null | undefined>;
export interface Scenario { id: string; name: string; answers: Answers; expect: { must_include: string[]; must_exclude: string[]; apply_section: string[]; tips_include: string[] } }
export interface Db {
  meta: { version: string; region: string; date_built: string; privacy: string; build_note: string; data_status_legend: Record<DataStatus, string> };
  zip_areas: ZipArea[]; organizations: Organization[]; services: Service[]; tips: Tip[];
  checklist: { have_ready: string[]; call_script: string };
  test_scenarios: Scenario[];
}

export const db = raw as unknown as Db;
