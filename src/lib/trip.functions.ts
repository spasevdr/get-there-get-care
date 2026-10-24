import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { TripData } from "./trip";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";
const DETROIT = { latitude: 42.3314, longitude: -83.0458 };
const DAILY_CAP = 500;
let day = "";
let count = 0;
const cache = new Map<string, { at: number; data: TripResult }>();

export type TripResult = { ok: true; clinic: string; data: TripData } | { ok: false; error: string };

const input = z.object({
  clinic: z.string().trim().min(3).max(120),
  from: z.string().trim().min(3).max(80),
  when: z.string().datetime(),
  bus: z.boolean(),
});

async function gw(path: string, key: string, apiKey: string, init: RequestInit & { mask?: string } = {}) {
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": apiKey, "Content-Type": "application/json" };
  if (init.mask) headers["X-Goog-FieldMask"] = init.mask;
  const res = await fetch(`${GATEWAY}${path}`, { ...init, headers });
  if (res.status === 403) throw new Error("Google Maps access was denied. Check the Google Maps connection.");
  if (!res.ok) {
    console.error(`Maps ${path} failed [${res.status}]: ${await res.text()}`);
    throw new Error("Trip lookup failed");
  }
  return res.json();
}

const mins = (s?: string) => (s ? Math.round(parseFloat(s) / 60) : null);

export const checkTrip = createServerFn({ method: "POST" })
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data }): Promise<TripResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    const apiKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!key || !apiKey) return { ok: false, error: "Trip info isn't set up yet." };

    const ck = JSON.stringify({ ...data, when: data.when.slice(0, 13) });
    const hit = cache.get(ck);
    if (hit && Date.now() - hit.at < 10 * 60_000) return hit.data;

    const today = new Date().toISOString().slice(0, 10);
    if (today !== day) { day = today; count = 0; }
    if (++count > DAILY_CAP) return { ok: false, error: "Trip info is busy today. Please try again tomorrow." };

    try {
      const bias = { circle: { center: DETROIT, radius: 40000 } };
      const [clinicRes, fromRes] = await Promise.all([
        gw("/places/v1/places:searchText", key, apiKey, { method: "POST", mask: "places.displayName,places.formattedAddress,places.location", body: JSON.stringify({ textQuery: data.clinic, pageSize: 1, locationBias: bias }) }),
        gw("/places/v1/places:searchText", key, apiKey, { method: "POST", mask: "places.location", body: JSON.stringify({ textQuery: `${data.from}, Detroit area, MI`, pageSize: 1, locationBias: bias }) }),
      ]);
      const clinic = clinicRes.places?.[0];
      const from = fromRes.places?.[0];
      if (!clinic?.location) return { ok: false, error: "We couldn't find that clinic. Try the full name or street address." };
      if (!from?.location) return { ok: false, error: "We couldn't find that ZIP code or cross streets." };

      const apptAt = new Date(data.when);
      const hoursAhead = (apptAt.getTime() - Date.now()) / 3_600_000;
      const leave = new Date(Math.max(Date.now() + 60_000, apptAt.getTime() - 45 * 60_000)).toISOString();
      const wp = (l: { latitude: number; longitude: number }) => ({ location: { latLng: l } });
      const route = (mode: "DRIVE" | "TRANSIT") =>
        gw("/routes/directions/v2:computeRoutes", key, apiKey, {
          method: "POST",
          mask: "routes.duration,routes.staticDuration,routes.warnings,routes.travelAdvisory",
          body: JSON.stringify({ origin: wp(from.location), destination: wp(clinic.location), travelMode: mode, departureTime: leave, ...(mode === "DRIVE" ? { routingPreference: "TRAFFIC_AWARE_OPTIMAL" } : {}) }),
        }).catch(() => null);

      const weatherP = hoursAhead >= -1 && hoursAhead <= 48
        ? gw(`/weather/v1/forecast/hours:lookup?location.latitude=${clinic.location.latitude}&location.longitude=${clinic.location.longitude}&hours=${Math.max(1, Math.ceil(hoursAhead) + 1)}&unitsSystem=IMPERIAL`, key, apiKey).catch(() => null)
        : Promise.resolve(null);

      const [drive, transit, weather] = await Promise.all([route("DRIVE"), data.bus ? route("TRANSIT") : Promise.resolve(null), weatherP]);
      const r = drive?.routes?.[0];
      const hours: any[] = weather?.forecastHours ?? [];
      const h = hours.reduce<any>((best, x) => {
        const t = new Date(x?.interval?.startTime ?? 0).getTime();
        return !best || Math.abs(t - apptAt.getTime()) < Math.abs(new Date(best.interval.startTime).getTime() - apptAt.getTime()) ? x : best;
      }, null);

      const result: TripResult = {
        ok: true,
        clinic: `${clinic.displayName?.text ?? "Clinic"} — ${clinic.formattedAddress ?? ""}`,
        data: {
          driveMin: mins(r?.duration),
          normalMin: mins(r?.staticDuration),
          busMin: mins(transit?.routes?.[0]?.duration),
          warnings: r?.warnings ?? [],
          weather: h ? { text: h.weatherCondition?.description?.text ?? "Unknown", tempF: h.temperature?.degrees != null ? Math.round(h.temperature.degrees) : null, rainChance: h.precipitation?.probability?.percent ?? null } : null,
          hoursAhead,
        },
      };
      cache.set(ck, { at: Date.now(), data: result });
      return result;
    } catch (e) {
      return { ok: false, error: e instanceof Error && e.message.includes("denied") ? e.message : "Trip info is unavailable right now." };
    }
  });
