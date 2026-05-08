import { ClipboardList, Timer } from "lucide-react";
import { startExamSessionAction } from "@/actions/exam-actions";
import { PageShell } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExamStartPage() {
  return (
    <PageShell width="narrow">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
          <ClipboardList className="h-4 w-4" />
          Eksamensmodus
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Start eksamensøkt</h1>
        <p className="mt-2 text-stone-500">Oppgaver trekkes fra hele pensum. Løsningsforslag er skjult underveis.</p>
      </div>

      <form action={startExamSessionAction}>
        <Card>
          <CardHeader>
            <CardTitle>Oppsett</CardTitle>
          </CardHeader>
          <CardContent className="space-y-7">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-stone-800">Antall oppgaver</legend>
              <div className="grid grid-cols-3 gap-2">
                {[5, 8, 10].map((count) => (
                  <label key={count} className="cursor-pointer">
                    <input className="peer sr-only" type="radio" name="count" value={count} defaultChecked={count === 8} />
                    <span className="block rounded-lg border border-stone-200 bg-white p-4 text-center transition-all peer-checked:border-stone-900 peer-checked:bg-stone-900 peer-checked:text-white">
                      <span className="block text-2xl font-semibold">{count}</span>
                      <span className="text-xs opacity-70">oppgaver</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
                <Timer className="h-4 w-4" />
                Tidsbegrensning
              </legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                  ["none", "Ingen"],
                  ["15", "15 min"],
                  ["30", "30 min"],
                  ["45", "45 min"],
                  ["60", "60 min"],
                  ["90", "90 min"]
                ].map(([value, label]) => (
                  <label key={value} className="cursor-pointer">
                    <input className="peer sr-only" type="radio" name="timeLimitMinutes" value={value} defaultChecked={value === "30"} />
                    <span className="block rounded-lg border border-stone-200 bg-white px-3 py-2 text-center text-sm font-semibold transition-all peer-checked:border-ntnu peer-checked:bg-red-50 peer-checked:text-ntnu">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="rounded-lg bg-stone-50 p-4 text-sm leading-relaxed text-stone-600">
              Når økten fullføres får du antall klart, antall ikke klart og anbefalte temaer videre.
            </div>

            <Button size="lg" variant="ntnu" className="w-full">
              Start økt
            </Button>
          </CardContent>
        </Card>
      </form>
    </PageShell>
  );
}
