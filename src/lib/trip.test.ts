import { describe, it, expect } from "vitest";
import { delayLevel, summarizeTrip } from "./trip";

const base = { driveMin: 20, normalMin: 18, busMin: null, warnings: [], weather: null, hoursAhead: 5 };

describe("trip rules", () => {
  it("15+ extra minutes is heavy", () => expect(delayLevel(33, 18)).toBe("heavy"));
  it("5-14 extra minutes is some", () => expect(delayLevel(25, 18)).toBe("some"));
  it("under 5 is none", () => expect(delayLevel(20, 18)).toBe("none"));
  it("normal trip: ready 45 min before", () => expect(summarizeTrip(base).readyMinutesBefore).toBe(45));
  it("heavy delay adds 20 min", () => expect(summarizeTrip({ ...base, driveMin: 33 }).readyMinutesBefore).toBe(75));
  it("snow adds 15 min", () => expect(summarizeTrip({ ...base, weather: { text: "Light snow", tempF: 28, rainChance: 40 } }).readyMinutesBefore).toBe(60));
  it("more than 48h ahead says check later", () => expect(summarizeTrip({ ...base, hoursAhead: 100 }).tips[0]).toMatch(/day before/));
});
