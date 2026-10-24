import { describe, it, expect } from "vitest";
import { matchPrograms } from "./navigator";

const base = { detroit: "yes", insurance: "private", timing: "later", wheelchair: "no", senior: "no", family: "no" };
const ids = (a: Record<string, string>) => matchPrograms(a).map((r) => r.program.id);

describe("matching", () => {
  it("Medicaid resident gets health plan rides", () => expect(ids({ ...base, insurance: "medicaid" })).toContain("plan"));
  it("same-day appointments get no plan rides", () => expect(ids({ ...base, insurance: "medicaid", timing: "today" })).not.toContain("plan"));
  it("unsure insurance adds a confirm item", () => {
    const r = matchPrograms({ ...base, insurance: "unsure" }).find((x) => x.program.id === "plan");
    expect(r?.confirm.length).toBeGreaterThan(0);
  });
  it("wheelchair need in Detroit gets accessible van", () => expect(ids({ ...base, wheelchair: "yes" })).toContain("van"));
  it("non-Detroit private insurance gets no match", () => expect(ids({ ...base, detroit: "no" })).toEqual([]));
});
