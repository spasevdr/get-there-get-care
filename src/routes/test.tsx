import { createFileRoute, Link } from "@tanstack/react-router";
import { db } from "@/lib/db";
import { checkScenario } from "@/lib/matcher";

export const Route = createFileRoute("/test")({
  head: () => ({
    meta: [
      { title: "Test scenarios — Detroit Ride Navigator" },
      { name: "description", content: "Developer page that checks the ride matching rules against seven patient scenarios." },
      { property: "og:title", content: "Detroit Ride Navigator test scenarios" },
      { property: "og:description", content: "Pass/fail checks for the ride matching rules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TestPage,
});

function TestPage() {
  const rows = db.test_scenarios.map((sc) => ({ sc, ...checkScenario(sc, db) }));
  const passed = rows.filter((r) => r.pass).length;
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-8">
      <h1 className="font-display text-3xl text-foreground">Test scenarios</h1>
      <p className="text-muted-foreground">{passed} of {rows.length} passing</p>
      {rows.map(({ sc, pass, fails }) => (
        <article key={sc.id} className="space-y-2 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">{sc.name}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pass ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>{pass ? "PASS" : "FAIL"}</span>
          </div>
          {fails.length > 0 && <ul className="list-disc pl-5 text-sm text-destructive">{fails.map((f) => <li key={f}>{f}</li>)}</ul>}
          <Link to="/" search={{ scenario: sc.id }} className="inline-block rounded-xl border-2 border-border px-4 py-2 font-medium text-foreground">Load these answers</Link>
        </article>
      ))}
    </main>
  );
}
