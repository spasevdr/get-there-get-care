import { describe, it, expect } from "vitest";
import { matchPrograms, visibleQuestions, accessNotes } from "./navigator";

const base = { for: "me", age: "adult", detroit: "yes", language: "en", hearing: "no", phone: "yes", insurance: "private", timing: "7+", time: "weekday-day", kind: "medical", pregnant: "no", mobility: "none", bus: "yes", companion: "no", cost: "yes" };
const ids = (a: Record<string, string>) => matchPrograms(a).map((r) => r.program.id);

describe("matching", () => {
  it("Medicaid gets plan rides", () => expect(ids({ ...base, insurance: "medicaid" })).toContain("medicaid"));
  it("Detroit senior gets DAAA", () => expect(ids({ ...base, age: "senior" })).toContain("daaa"));
  it("DAAA not offered for Sunday/evening", () => expect(ids({ ...base, age: "senior", time: "off-hours" })).not.toContain("daaa"));
  it("non-Detroit senior gets no DAAA", () => expect(ids({ ...base, age: "senior", detroit: "no" })).not.toContain("daaa"));
  it("wheelchair today gets DDOT Now, not paratransit", () => {
    const r = ids({ ...base, mobility: "wheelchair", timing: "today" });
    expect(r).toContain("ddotnow");
    expect(r).not.toContain("paratransit");
  });
  it("2-1-1 always shown", () => expect(ids({ ...base, detroit: "no" })).toEqual(["uw211"]));
  it("card question only for Medicaid", () => {
    expect(visibleQuestions(base).some((q) => q.id === "card")).toBe(false);
    expect(visibleQuestions({ ...base, insurance: "both" }).some((q) => q.id === "card")).toBe(true);
  });
  it("Spanish speaker gets interpreter note", () => expect(accessNotes({ ...base, language: "es" }).length).toBe(2));
});

import { QUESTIONS, HSDS_MAP } from "./navigator";
import { SERVICES } from "./hsds";
describe("HSDS alignment", () => {
  it("every question maps to an HSDS field", () => QUESTIONS.forEach((q) => expect(HSDS_MAP[q.id]).toBeTruthy()));
  it("every service has HSDS required fields", () => SERVICES.forEach((s) => { expect(s.id).toBeTruthy(); expect(s.name).toBeTruthy(); expect(s.status).toBe("active"); expect(s.organization.id).toBeTruthy(); }));
  it("DAAA minimum age is 60", () => expect(SERVICES.find((s) => s.id === "daaa")?.minimum_age).toBe(60));
});
