import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TripCard } from "@/components/TripCard";
import { visibleQuestions, matchPrograms, accessNotes, READY_LIST, CALL_SCRIPT, CHECKED, type Answers, type Question } from "@/lib/navigator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Detroit Ride Navigator — Rides to medical appointments" },
      { name: "description", content: "Answer six quick questions and find possible rides to your medical appointment in Detroit." },
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
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const reset = () => { setAnswers({}); setStep(-1); };
  const qs = visibleQuestions(answers);

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
        {step >= 0 && step < qs.length && (
          <QuestionStep
            q={qs[step]!}
            index={step}
            total={qs.length}
            value={answers[qs[step]!.id]}
            onPick={(v) => setAnswers({ ...answers, [qs[step]!.id]: v })}
            onBack={() => setStep(step - 1)}
            onNext={() => setStep(step + 1)}
          />
        )}
        {step >= qs.length && <Results answers={answers} onBack={() => setStep(qs.length - 1)} onReset={reset} />}
      </main>
    </div>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl leading-tight text-foreground">Need a ride to your doctor?</h1>
      <p className="text-lg text-muted-foreground">Answer a few quick questions (about 2 minutes). We'll show ride options that may fit and exactly what to do next. No name or sign-up needed.</p>
      <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-foreground">
        <strong>Medical emergency?</strong> Call 911 now.
      </div>
      <button onClick={onStart} className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}>Get started</button>
      <p className="text-sm text-muted-foreground">Clinic staff and navigators can also go through this with a patient.</p>
    </div>
  );
}

function QuestionStep({ q, index, total, value, onPick, onBack, onNext }: { q: Question; index: number; total: number; value?: string | undefined; onPick: (v: string) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">{q.section} · Question {index + 1} of {total}</p>
        <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
      </div>
      <h2 className="font-display text-3xl text-foreground">{q.text}</h2>
      {q.help && <p className="text-muted-foreground">{q.help}</p>}
      <div className="space-y-3" role="radiogroup">
        {q.options.map((o) => (
          <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onPick(o.value)}
            className={`${btn} border-2 text-left ${value === o.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className={`${btn} border-2 border-border bg-card text-foreground`}>Back</button>
        <button onClick={onNext} disabled={!value} className={`${btn} bg-primary text-primary-foreground disabled:opacity-40`}>Next</button>
      </div>
    </div>
  );
}

function Results({ answers, onBack, onReset }: { answers: Answers; onBack: () => void; onReset: () => void }) {
  const results = matchPrograms(answers);
  return (
    <div className="space-y-6">
      <p className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Program details found online on {CHECKED}. Always confirm with the program.</p>
      <h2 className="font-display text-3xl text-foreground">Your ride plan</h2>
      {answers["timing"] === "today" && (
        <div className="rounded-2xl border-2 border-warning bg-warning/15 p-4 text-foreground">
          <strong>Appointment today?</strong> Most insurance rides need a few days' notice. Try: calling your clinic to ask about their social worker or ride help, taking the bus, or asking to reschedule if you can't get there.
        </div>
      )}
      {results.length === 0 ? (
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="text-xl font-semibold text-foreground">No matching option found</h3>
          <p className="mt-2 text-muted-foreground">Call your clinic and ask: "Do you help patients get rides?" Many clinics have a social worker or community health worker who can help. You can also call 211 for local resources.</p>
        </div>
      ) : results.map((r) => (
        <article key={r.program.id} className="space-y-3 rounded-2xl border bg-card p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">Potential option</span>
          <h3 className="text-xl font-semibold text-foreground">{r.program.name}</h3>
          <p className="text-foreground">{r.program.offers}</p>
          <div><p className="font-semibold text-foreground">Why it may fit</p><ul className="list-disc pl-5 text-muted-foreground">{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div><p className="font-semibold text-foreground">Still needs confirming</p><ul className="list-disc pl-5 text-muted-foreground">{(r.confirm.length ? r.confirm : ["Contact the program to confirm."]).map((x) => <li key={x}>{x}</li>)}</ul></div>
          <p className="text-foreground"><strong>How to contact:</strong> {r.program.contact}</p>
          {r.program.phone && <a href={`tel:${r.program.phone}`} className="no-print inline-block rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">Tap to call</a>}
          <p className="break-all text-sm text-muted-foreground">Source: <a className="underline" href={r.program.source} target="_blank" rel="noreferrer">{r.program.source}</a> · Checked {CHECKED}</p>
        </article>
      ))}
      {accessNotes(answers).length > 0 && (
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="text-xl font-semibold text-foreground">Tips for your situation</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">{accessNotes(answers).map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      )}
      <TripCard canBus={answers["bus"] !== "no"} />
      <section className="rounded-2xl border bg-card p-5">
        <h3 className="text-xl font-semibold text-foreground">Have this ready when you call</h3>
        <ul className="mt-2 space-y-1">{READY_LIST.map((x) => <li key={x} className="text-foreground">☐ {x}</li>)}</ul>
        <p className="mt-4 font-semibold text-foreground">What to say</p>
        <p className="italic text-muted-foreground">"{CALL_SCRIPT}"</p>
      </section>
      <p className="text-sm text-muted-foreground">This is not medical or legal advice. Program details can change — always confirm with the program.</p>
      <div className="no-print grid gap-3 sm:grid-cols-3">
        <button onClick={onBack} className={`${btn} border-2 border-border bg-card text-foreground`}>Back</button>
        <button onClick={() => window.print()} className={`${btn} bg-primary text-primary-foreground`}>Print</button>
        <button onClick={onReset} className={`${btn} border-2 border-border bg-card text-foreground`}>Start over</button>
      </div>
    </div>
  );
}
