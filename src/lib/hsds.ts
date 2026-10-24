import { db, type Service } from "./db";

/** HSDS 3.0-shaped view of the program data file, for sharing with 2-1-1 or other referral systems. */
const toHsds = (s: Service) => {
  const org = db.organizations.find((o) => o.id === s.organization_id);
  return {
    id: s.id, name: s.name, status: "active", description: s.offers, url: s.source_url, last_modified: `${s.date_checked}T00:00:00Z`,
    organization: { id: s.organization_id, name: org?.name ?? "" },
    minimum_age: s.eligibility.age_min, maximum_age: s.eligibility.age_max,
    eligibility_description: `Insurance: ${s.eligibility.insurance_accepted.join(", ")}`,
    application_process: s.booking.note,
    fees_description: s.fare.amount_usd ? `$${s.fare.amount_usd.toFixed(2)} per ride` : "Free",
    cost_options: [{ id: `${s.id}-fare`, amount: s.fare.amount_usd, currency: "USD" }],
    languages: s.accessibility.languages.map((l) => ({ id: `${s.id}-${l}`, name: l })),
    phones: [s.contact.phone && { id: `${s.id}-ph`, number: s.contact.phone, type: "voice" }, s.contact.tty && { id: `${s.id}-tty`, number: s.contact.tty, type: "tty" }].filter(Boolean),
    service_areas: [{ id: `${s.id}-area`, name: s.coverage.type, extent: s.coverage.zips.length ? s.coverage.zips : s.coverage.counties }],
    x_data_status: s.data_status,
  };
};

export const SERVICES = db.services.map(toHsds);
export const hsdsExport = () => ({ hsds_version: "3.0", generated_from: "Detroit Ride Navigator", services: SERVICES });
