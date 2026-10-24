import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TripCard } from "@/components/TripCard";
import { hsdsExport } from "@/lib/hsds";
import { db, type Answers } from "@/lib/db";
import { matchPrograms, activeTips, findZip, type Match } from "@/lib/matcher";
import { HSDS_MAP, intakeExport, visibleQuestions, cleanAnswers, type Question } from "@/lib/questions";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { scenario?: string } => (typeof s["scenario"] === "string" ? { scenario: s["scenario"] } : {}),
  head: () => ({
    meta: [
      { title: "Detroit Ride Navigator — Rides to medical appointments" },
      { name: "description", content: "Answer a few quick questions and find possible rides to your medical appointment in Detroit." },
      { property: "og:title", content: "Detroit Ride Navigator" },
      { property: "og:description", content: "Find possible rides to your medical appointment in about a minute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const btn = "w-full rounded-2xl px-6 py-4 text-lg font-semibold transition-colors";

function Index() {
  const { scenario } = Route.useSearch();
  const preset = db.test_scenarios.find((s) => s.id === scenario);
  const [answers, setAnswers] = useState<Answers>(preset?.answers ?? {});
  const [step, setStep] = useState(preset ? 999 : -1);
  const [printView, setPrintView] = useState(false);
  const reset = () => { setAnswers({}); setStep(-1); setPrintView(false); };
  const qs = visibleQuestions(answers);
  const atResults = step >= qs.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b bg-card">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-4">
          <span className="font-display text-xl text-primary">Detroit Ride Navigator</span>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">Hackathon prototype</span>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-5 py-8">
        {step === -1 && <Welcome onStart={() => setStep(0)} />}
        {step >= 0 && !atResults && (
          <QuestionStep q={qs[step]!} index={step} total={qs.length} value={answers[qs[step]!.id] ?? undefined}
            onPick={(v) => setAnswers({ ...answers, [qs[step]!.id]: v })}
            onBack={() => setStep(step - 1)} onNext={() => setStep(step + 1)} />
        )}
        {atResults && (printView
          ? <PrintPlan answers={cleanAnswers(answers)} onClose={() => setPrintView(false)} />
          : <Results answers={cleanAnswers(answers)} onBack={() => setStep(qs.length - 1)} onReset={reset} onPrint={() => setPrintView(true)} />)}
      </main>
      <footer className="mx-auto max-w-xl px-5 pb-8 text-sm text-muted-foreground">
        Hackathon prototype · Not medical or legal advice · Program rules change — always confirm by phone · Demo programs marked purple are fictional.
        <span className="block mt-1">Your answers stay on this page and are not saved. The optional trip check sends only the clinic, ZIP and time you type, and only when you tap it.</span>
      </footer>
    </div>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl leading-tight text-foreground">Need a ride to your doctor?</h1>
      <p className="text-lg text-muted-foreground">Answer a few quick questions (about 2 minutes). We'll show ride options that may fit and exactly what to do next. No name or sign-up needed.</p>
      <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-foreground"><strong>Medical emergency?</strong> Call 911 now.</div>
      <button onClick={onStart} className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}>Get started</button>
      <p className="text-sm text-muted-foreground">Clinic staff and navigators can also go through this with a patient.</p>
    </div>
  );
}

function QuestionStep({ q, index, total, value, onPick, onBack, onNext }: { q: Question; index: number; total: number; value?: string | undefined; onPick: (v: string | null) => void; onBack: () => void; onNext: () => void }) {
  const [zip, setZip] = useState(q.kind === "zip" ? value ?? "" : "");
  const zipOk = /^\d{5}$/.test(zip);
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">{q.section} · Question {index + 1} of {total}</p>
        <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
      </div>
      <h2 className="font-display text-3xl text-foreground">{q.text}</h2>
      {q.help && <p className="text-muted-foreground">{q.help}</p>}
      <p className="text-xs text-muted-foreground">Open Referral (HSDS) field: {HSDS_MAP[q.id]}</p>
      {q.kind === "zip" ? (
        <div className="space-y-3">
          <input inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 48209" aria-label="ZIP code"
            className="w-full rounded-2xl border-2 border-border bg-card px-6 py-4 text-2xl tracking-widest text-foreground" />
          {zipOk && !findZip(db, zip) && <p className="text-sm text-muted-foreground">We don't have neighborhood data for this ZIP yet — showing area-wide programs.</p>}
          <div className="flex gap-3">
            <button onClick={onBack} className={`${btn} border-2 border-border bg-card text-foreground`}>Back</button>
            <button onClick={() => { onPick(null); onNext(); }} className={`${btn} border-2 border-border bg-card text-foreground`}>Skip</button>
            <button disabled={!zipOk} onClick={() => { onPick(zip); onNext(); }} className={`${btn} bg-primary text-primary-foreground disabled:opacity-40`}>Next</button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3" role="radiogroup">
            {q.options.map((o) => (
              <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onPick(o.value)}
                className={`${btn} border-2 text-left ${value === o.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`}>{o.label}</button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className={`${btn} border-2 border-border bg-card text-foreground`}>Back</button>
            <button onClick={onNext} disabled={!value} className={`${btn} bg-primary text-primary-foreground disabled:opacity-40`}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ m }: { m: Match }) {
  const s = m.service;
  if (s.data_status === "verified_from_source") return <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Source checked {s.date_checked}</span>;
  if (s.data_status === "placeholder_real_org") return <span className="rounded-full bg-warning/25 px-3 py-1 text-xs font-medium text-foreground">Rules not yet verified — confirm by phone</span>;
  return <span className="rounded-full bg-demo/15 px-3 py-1 text-xs font-medium text-demo">Demo program (fictional)</span>;
}

const LANGS: Record<string, string> = { english: "English", spanish: "Spanish", arabic: "Arabic", bengali: "Bengali", other: "Other languages" };

function Card({ m }: { m: Match }) {
  const s = m.service;
  const demo = s.data_status === "synthetic";
  return (
    <article className="space-y-3 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill m={m} />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">Potential option</span>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{m.tier}</span>
      </div>
      <h3 className="text-xl font-semibold text-foreground">{s.name}</h3>
      <p className="text-foreground">{s.offers}</p>
      <div><p className="font-semibold text-foreground">Why it may fit</p><ul className="list-disc pl-5 text-muted-foreground">{m.reasons.map((x) => <li key={x}>{x}</li>)}</ul></div>
      <div><p className="font-semibold text-foreground">What still needs confirming</p><ul className="list-disc pl-5 text-muted-foreground">{(m.confirms.length ? m.confirms : ["Contact the program to confirm."]).map((x) => <li key={x}>{x}</li>)}</ul></div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-foreground">
        <dt className="font-semibold">Fare</dt><dd>{s.fare.amount_usd ? `$${s.fare.amount_usd.toFixed(2)} per ride` : "Free"}</dd>
        <dt className="font-semibold">Booking</dt><dd>{s.booking.note ?? "Contact the program to confirm."}</dd>
        <dt className="font-semibold">Hours</dt><dd>{s.contact.call_hours_note ?? "Contact the program to confirm."}</dd>
        <dt className="font-semibold">Languages</dt><dd>{s.accessibility.languages.map((l) => LANGS[l]).join(", ")}</dd>
      </dl>
      <div className="no-print flex flex-wrap gap-2">
        {s.contact.phone
          ? demo
            ? <button disabled title="Demo data" className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground opacity-40">Tap to call {s.contact.phone_display}</button>
            : <a href={`tel:${s.contact.phone}`} className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">Tap to call {s.contact.phone_display}</a>
          : <span className="rounded-xl bg-muted px-4 py-2 text-foreground">{s.contact.phone_display ?? "Contact the program to confirm."}</span>}
        {s.contact.url && <a href={s.contact.url} target="_blank" rel="noreferrer" className="rounded-xl border-2 border-border px-4 py-2 font-medium text-foreground">Visit website</a>}
      </div>
      <p className="hidden print:block text-sm text-foreground">Phone: {s.contact.phone_display ?? "Contact the program to confirm."}</p>
      {s.source_url && <p className="break-all text-sm text-muted-foreground">Source: <a className="underline" href={s.source_url} target="_blank" rel="noreferrer">{s.source_url}</a> · checked {s.date_checked}</p>}
    </article>
  );
}

function Results({ answers, onBack, onReset, onPrint }: { answers: Answers; onBack: () => void; onReset: () => void; onPrint: () => void }) {
  const r = matchPrograms(answers, db);
  const main = r.options.filter((m) => m.tier !== "Backup");
  const low = r.options.filter((m) => m.tier === "Backup");
  const tips = activeTips(answers, db);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-foreground"><strong>Medical emergency?</strong> Call 911.</div>
      {answers.appointment_when === "today" && <div className="rounded-2xl border-2 border-warning bg-warning/15 p-4 text-foreground"><strong>Your appointment is today</strong> — most rides need notice. Same-day options are shown first.</div>}
      {answers.appointment_time === "evening_night_sunday" && <div className="rounded-2xl border-2 border-warning bg-warning/15 p-4 text-foreground"><strong>Evening or Sunday appointment</strong> — fewer programs run then.</div>}
      <h2 className="font-display text-3xl text-foreground">Your ride plan</h2>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Potential options</h3>
        {main.length === 0
          ? <div className="rounded-2xl border bg-card p-5 text-foreground">We didn't find a program that clearly fits — call 2-1-1 and ask your clinic's social worker.</div>
          : main.map((m) => <Card key={m.service.id} m={m} />)}
      </section>

      {r.apply.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Apply for next time</h3>
          <p className="text-muted-foreground">{db.tips.find((t) => t.id === "apply_paratransit")?.text}</p>
          {r.apply.map((m) => <Card key={m.service.id} m={m} />)}
        </section>
      )}

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Backup — always available</h3>
        {[...r.backup, ...low].map((m) => <Card key={m.service.id} m={m} />)}
      </section>

      {tips.length > 0 && (
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="text-xl font-semibold text-foreground">Tips for your situation</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">{tips.map((t) => <li key={t.id}>{t.text}</li>)}</ul>
        </section>
      )}
      <div className="no-print"><TripCard canBus={answers.can_ride_bus_alone !== "no_disability"} /></div>
      <section className="no-print space-y-2 rounded-2xl border bg-card p-5">
        <h3 className="text-lg font-semibold text-foreground">For clinic staff & partners</h3>
        <p className="text-sm text-muted-foreground">Program data follows the <a className="underline" href="https://docs.openreferral.org/en/latest/hsds/schema_reference.html" target="_blank" rel="noreferrer">Open Referral HSDS 3.0</a> standard, so it can be shared with 2-1-1 and other referral systems.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => download("ride-programs-hsds.json", hsdsExport())} className="rounded-xl border-2 border-border px-4 py-2 font-medium text-foreground">Download program data (HSDS)</button>
          <button onClick={() => download("my-ride-answers.json", intakeExport(answers))} className="rounded-xl border-2 border-border px-4 py-2 font-medium text-foreground">Download my answers</button>
        </div>
      </section>
      <div className="no-print grid gap-3 sm:grid-cols-3">
        <button onClick={onBack} className={`${btn} border-2 border-border bg-card text-foreground`}>Back</button>
        <button onClick={onPrint} className={`${btn} bg-primary text-primary-foreground`}>Printable checklist</button>
        <button onClick={onReset} className={`${btn} border-2 border-border bg-card text-foreground`}>Start over</button>
      </div>
    </div>
  );
}

const statusText = (m: Match) => m.service.data_status === "verified_from_source" ? `Source checked ${m.service.date_checked}` : m.service.data_status === "synthetic" ? "Demo program (fictional)" : "Rules not yet verified — confirm by phone";

function PrintPlan({ answers, onClose }: { answers: Answers; onClose: () => void }) {
  const r = matchPrograms(answers, db);
  const top = [...r.options, ...r.backup].slice(0, 3);
  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl text-foreground">My ride action plan</h2>
      <section>
        <h3 className="text-xl font-semibold text-foreground">Call these first</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-foreground">
          {top.map((m) => <li key={m.service.id}><strong>{m.service.name}</strong> — {m.service.contact.phone_display ?? "Contact the program to confirm."} <span className="text-sm text-muted-foreground">({statusText(m)})</span></li>)}
        </ol>
      </section>
      <section>
        <h3 className="text-xl font-semibold text-foreground">Have this ready</h3>
        <ul className="mt-2 space-y-1">{db.checklist.have_ready.map((x) => <li key={x} className="text-foreground">☐ {x}</li>)}</ul>
        <p className="mt-4 font-semibold text-foreground">What to say</p>
        <p className="italic text-muted-foreground">"{db.checklist.call_script}"</p>
      </section>
      <div className="no-print grid gap-3 sm:grid-cols-2">
        <button onClick={onClose} className={`${btn} border-2 border-border bg-card text-foreground`}>Back to results</button>
        <button onClick={() => window.print()} className={`${btn} bg-primary text-primary-foreground`}>Print</button>
      </div>
    </div>
  );
}

function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
