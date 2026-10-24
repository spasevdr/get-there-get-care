// Program data stored in the Open Referral Human Services Data Specification (HSDS 3.0) shape.
// https://docs.openreferral.org/en/latest/hsds/schema_reference.html
// Field names follow HSDS; only fields we have verified facts for are filled in.

export type HsdsPhone = { id: string; number: string; type?: "voice" | "text" | "tty"; description?: string };
export type HsdsSchedule = { id: string; byday?: string; opens_at?: string; closes_at?: string; description?: string };
export type HsdsServiceArea = { id: string; name: string; description?: string };
export type HsdsLanguage = { id: string; name: string; code: string };
export type HsdsCostOption = { id: string; amount?: number; currency?: string; option?: string };
export type HsdsRequiredDocument = { id: string; document: string };
export type HsdsOrganization = { id: string; name: string; description: string; website?: string };

export type HsdsService = {
  id: string;
  organization: HsdsOrganization;
  name: string;
  description: string;
  url?: string;
  status: "active" | "inactive" | "defunct" | "temporarily closed";
  interpretation_services?: string;
  application_process?: string;
  fees_description?: string;
  eligibility_description?: string;
  minimum_age?: number;
  maximum_age?: number;
  alert?: string;
  last_modified: string;
  phones: HsdsPhone[];
  schedules: HsdsSchedule[];
  service_areas: HsdsServiceArea[];
  languages: HsdsLanguage[];
  cost_options: HsdsCostOption[];
  required_documents: HsdsRequiredDocument[];
};

const CHECKED_ISO = "2026-10-24T00:00:00Z";
const DHD_PAGE = "https://detroitmi.gov/departments/detroit-health-department/programs-and-services/resources-and-services-medical-care-transportation";
const DDOT_PAGE = "https://detroitmi.gov/departments/detroit-department-transportation/detroit-paratransit";
const detroit: HsdsServiceArea = { id: "area-detroit", name: "City of Detroit" };
const fare = (id: string): HsdsCostOption => ({ id, amount: 2.5, currency: "USD", option: "One-way fare" });

const orgs = {
  dhd: { id: "org-dhd", name: "Detroit Health Department", description: "City of Detroit public health department.", website: DHD_PAGE },
  ddot: { id: "org-ddot", name: "Detroit Department of Transportation (DDOT)", description: "City of Detroit public transit agency.", website: DDOT_PAGE },
  daaa: { id: "org-daaa", name: "Detroit Area Agency on Aging", description: "Services for older adults in Detroit and nearby communities.", website: "https://www.detroitseniorsolution.com" },
  uw: { id: "org-uw", name: "United Way 2-1-1", description: "Phone line connecting people to local help.", website: DHD_PAGE },
} satisfies Record<string, HsdsOrganization>;

export const SERVICES: HsdsService[] = [
  {
    id: "medicaid", organization: orgs.dhd, name: "Medicaid health plan rides", status: "active", last_modified: CHECKED_ISO, url: DHD_PAGE,
    description: "No-cost rides to doctor, pharmacy, dental and mental health visits for people with Medicaid or a Medicaid Health Plan.",
    eligibility_description: "People with Medicaid or a Medicaid Health Plan.",
    application_process: "Call the number on the back of the insurance card and ask for transportation. Example: Blue Cross Complete members call 1-888-803-4947 (TTY 711), at least 2 days before.",
    fees_description: "No cost (Blue Cross Complete example).",
    phones: [{ id: "ph-bcc", number: "1-888-803-4947", type: "voice", description: "Blue Cross Complete ride line, 24/7" }, { id: "ph-bcc-tty", number: "711", type: "tty" }],
    schedules: [{ id: "sch-bcc", description: "Blue Cross Complete: 24 hours a day, 7 days a week" }],
    service_areas: [], languages: [], cost_options: [{ id: "co-bcc", amount: 0, currency: "USD", option: "No cost" }],
    required_documents: [{ id: "rd-card", document: "Insurance member ID card" }],
  },
  {
    id: "daaa", organization: orgs.daaa, name: "Detroit Area Agency on Aging — curb-to-curb rides", status: "active", last_modified: CHECKED_ISO, url: "https://www.detroitseniorsolution.com/city-of-detroit",
    description: "Rides to medical, dental, therapy and pharmacy visits for Detroit residents 60+ or with a disability. $2.50 each way, paid on the vehicle. Mon–Fri 8 am–6 pm, Sat 8 am–4 pm.",
    eligibility_description: "Detroit residents 60 and older or with a disability (may require verification).",
    minimum_age: 60,
    application_process: "Call (313) 446-4444. New riders register at least 3 working days before the first ride; after that, 1 day notice.",
    fees_description: "$2.50 each way, paid on the vehicle.",
    phones: [{ id: "ph-daaa", number: "313-446-4444", type: "voice" }],
    schedules: [{ id: "sch-daaa-wk", byday: "MO,TU,WE,TH,FR", opens_at: "08:00", closes_at: "18:00" }, { id: "sch-daaa-sa", byday: "SA", opens_at: "08:00", closes_at: "16:00" }],
    service_areas: [detroit], languages: [], cost_options: [fare("co-daaa")], required_documents: [],
  },
  {
    id: "paratransit", organization: orgs.ddot, name: "DDOT Paratransit (MetroLift)", status: "active", last_modified: CHECKED_ISO, url: DDOT_PAGE,
    description: "Shared door-to-door rides for people who can't use a regular bus because of a disability. $2.50 cash, exact change. Must live within ¾ mile of a DDOT bus route.",
    eligibility_description: "Unable to independently board, ride or leave a ramp-equipped bus due to a disability, verified by a professional.",
    application_process: "Approved riders book 1 day to 2 weeks ahead at 313-774-5555. Not approved yet? Apply first — forms come in English, Spanish and Arabic and need a professional's form.",
    fees_description: "$2.50 cash, exact change.",
    phones: [{ id: "ph-para", number: "313-774-5555", type: "voice" }],
    schedules: [{ id: "sch-para", description: "Hours comparable to DDOT fixed-route bus service" }],
    service_areas: [{ id: "area-ddot", name: "Within ¾ mile of a DDOT bus route" }],
    languages: [{ id: "l-en", name: "English", code: "en" }, { id: "l-es", name: "Spanish", code: "es" }, { id: "l-ar", name: "Arabic", code: "ar" }],
    cost_options: [fare("co-para")],
    required_documents: [{ id: "rd-pv", document: "Professional Verification Form (part of application)" }],
  },
  {
    id: "ddotnow", organization: orgs.ddot, name: "DDOT Now (same-day paratransit)", status: "active", last_modified: CHECKED_ISO, url: DDOT_PAGE,
    description: "Book as soon as 1 hour ahead. $2.50 cash. First come, first served — not guaranteed.",
    application_process: "Call 313-570-6845.", fees_description: "$2.50 cash, exact change.",
    phones: [{ id: "ph-now", number: "313-570-6845", type: "voice" }],
    schedules: [], service_areas: [], languages: [], cost_options: [fare("co-now")], required_documents: [],
  },
  {
    id: "baby", organization: orgs.dhd, name: "Detroit Health Department pregnancy & baby help line", status: "active", last_modified: CHECKED_ISO, url: DHD_PAGE,
    description: "Help for pregnancy and infant needs, including getting to appointments.",
    application_process: "Call 313-961-BABY (2229).",
    phones: [{ id: "ph-baby", number: "313-961-2229", type: "voice" }],
    schedules: [], service_areas: [detroit], languages: [], cost_options: [], required_documents: [],
  },
  {
    id: "uw211", organization: orgs.uw, name: "United Way 2-1-1", status: "active", last_modified: CHECKED_ISO, url: DHD_PAGE,
    description: "Checks whether you qualify for a free or discounted ride through local partners, especially when nothing else works.",
    application_process: "Call 2-1-1.",
    phones: [{ id: "ph-211", number: "211", type: "voice" }],
    schedules: [], service_areas: [], languages: [], cost_options: [], required_documents: [],
  },
];

export const service = (id: string) => {
  const s = SERVICES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown service ${id}`);
  return s;
};

/** HSDS 3.0-shaped export of all services, for sharing with 2-1-1 or other referral systems. */
export const hsdsExport = () => ({ hsds_version: "3.0", generated_from: "Detroit Ride Navigator", services: SERVICES });
