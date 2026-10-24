import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkTrip, type TripResult } from "@/lib/trip.functions";
import { summarizeTrip } from "@/lib/trip";

const field = "w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-lg text-foreground";

export function TripCard({ canBus }: { canBus: boolean }) {
  const run = useServerFn(checkTrip);
  const [clinic, setClinic] = useState("");
  const [from, setFrom] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<TripResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setRes(await run({ data: { clinic, from, when: new Date(`${date}T${time}`).toISOString(), bus: canBus } }));
    } catch {
      setRes({ ok: false, error: "Please check the details and try again." });
    } finally {
      setBusy(false);
    }
  };

  const summary = res?.ok ? summarizeTrip(res.data) : null;
  const readyBy = summary && date && time
    ? new Date(new Date(`${date}T${time}`).getTime() - summary.readyMinutesBefore * 60_000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Trip conditions (optional)</h3>
        <p className="text-muted-foreground">Check traffic, road delays and weather for your trip. Nothing you type is saved.</p>
      </div>
      {!summary && (
        <form onSubmit={submit} className="no-print space-y-3">
          <label className="block space-y-1"><span className="font-medium text-foreground">Clinic name or address</span>
            <input required minLength={3} maxLength={120} className={field} value={clinic} onChange={(e) => setClinic(e.target.value)} placeholder="e.g. Henry Ford Hospital" /></label>
          <label className="block space-y-1"><span className="font-medium text-foreground">Your ZIP code or nearest cross streets</span>
            <input required minLength={3} maxLength={80} className={field} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. 48205 or Gratiot & 7 Mile" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><span className="font-medium text-foreground">Appointment date</span>
              <input required type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="block space-y-1"><span className="font-medium text-foreground">Time</span>
              <input required type="time" className={field} value={time} onChange={(e) => setTime(e.target.value)} /></label>
          </div>
          <button disabled={busy} className="w-full rounded-2xl bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground disabled:opacity-50">
            {busy ? "Checking…" : "Check my trip"}
          </button>
        </form>
      )}
      {res && !res.ok && <p className="rounded-xl bg-destructive/10 p-3 text-foreground">{res.error}</p>}
      {res?.ok && summary && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">To: {res.clinic}</p>
          {summary.delayLevel === "heavy" && <p className="rounded-xl border-2 border-warning bg-warning/15 p-3 font-semibold text-foreground">Delays on your route</p>}
          <ul className="list-disc space-y-1 pl-5 text-foreground">{summary.tips.map((t) => <li key={t}>{t}</li>)}</ul>
          {readyBy && <p className="rounded-xl bg-accent p-3 text-lg font-semibold text-accent-foreground">Be ready for pickup by {readyBy}</p>}
          <p className="text-xs text-muted-foreground">Traffic and weather from Google Maps. These are estimates and can change.</p>
          <button onClick={() => setRes(null)} className="no-print text-primary underline">Check a different trip</button>
        </div>
      )}
    </section>
  );
}
