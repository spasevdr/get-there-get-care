export type TripData = {
  driveMin: number | null;
  normalMin: number | null;
  busMin: number | null;
  warnings: string[];
  weather: { text: string; tempF: number | null; rainChance: number | null } | null;
  hoursAhead: number;
};

export type TripSummary = { tips: string[]; delayLevel: "none" | "some" | "heavy" | "unknown"; readyMinutesBefore: number };

export function delayLevel(drive: number | null, normal: number | null): TripSummary["delayLevel"] {
  if (drive == null || normal == null || normal <= 0) return "unknown";
  const extra = drive - normal;
  if (extra >= 15 || drive >= normal * 1.5) return "heavy";
  if (extra >= 5) return "some";
  return "none";
}

const BAD_WEATHER = /snow|ice|sleet|freez|storm|thunder|blizzard|hail/i;

export function summarizeTrip(d: TripData): TripSummary {
  const tips: string[] = [];
  const level = delayLevel(d.driveMin, d.normalMin);
  // Base: 20-minute pickup window plus drive time, rounded up to 15 minutes.
  let ready = 20 + (d.driveMin ?? 30);
  if (level === "heavy") ready += 20;
  else if (level === "some") ready += 10;

  if (d.hoursAhead > 48) {
    tips.push("Traffic and weather can't be predicted this far ahead. Check again the day before.");
  } else {
    if (level === "heavy") tips.push(`Heavy delays on your route: about ${d.driveMin} min by car (usually ${d.normalMin}). Book an earlier pickup.`);
    if (level === "some") tips.push(`Some slowdowns: about ${d.driveMin} min by car (usually ${d.normalMin}).`);
    if (level === "none" && d.driveMin != null) tips.push(`Traffic looks normal: about ${d.driveMin} min by car.`);
    if (d.warnings.length) tips.push("Google reports possible road problems on the way. Ask your driver about detours.");
    if (d.weather) {
      const w = d.weather;
      const bad = BAD_WEATHER.test(w.text);
      tips.push(`Weather at appointment time: ${w.text}${w.tempF != null ? `, ${w.tempF}°F` : ""}.`);
      if (bad) { ready += 15; tips.push("Roads may be slippery. Allow extra time and dress warm while waiting for pickup."); }
      else if ((w.rainChance ?? 0) >= 50) { ready += 5; tips.push("Rain likely — bring an umbrella for the wait."); }
    }
  }
  if (d.busMin != null) tips.push(`By bus: about ${d.busMin} min.`);
  return { tips, delayLevel: level, readyMinutesBefore: Math.ceil(ready / 15) * 15 };
}
