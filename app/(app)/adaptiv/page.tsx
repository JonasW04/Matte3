import Link from "next/link";
import { ArrowRight, Brain, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { ProgressStatus } from "@prisma/client";
import { markProblemAction } from "@/actions/progress-actions";
import { PageShell } from "@/components/app/page-shell";
import { MathText } from "@/components/math/math-text";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getAdaptiveRecommendations } from "@/lib/adaptive";
import { resolveStatus } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function AdaptivePage() {
  const user = await requireUser();
  const recommendations = await getAdaptiveRecommendations(user.id, 8);

  return (
    <PageShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            <Brain className="h-4 w-4" />
            Adaptiv øving
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Personlig oppgavekø</h1>
          <p className="mt-2 max-w-2xl text-stone-500">
            Oppgaver fra hele pensum prioriteres etter uløste forsøk, dekning, nylighet og svake undertemaer.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/eksamen">
            Start eksamensmodus
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState title="Ingen adaptive forslag" text="Importer flere oppgaver eller marker noen oppgaver som ikke klart." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {recommendations.map((item, index) => {
              const status = resolveStatus(item.problem.progress[0]);
              return (
                <Card key={item.problem.id}>
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone="info">#{index + 1}</Badge>
                      <StatusBadge status={status} />
                      {item.problem.isSeedMock && <Badge tone="warning">Seed/mock</Badge>}
                    </div>
                    <CardTitle>{item.problem.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <span>{item.problem.source.courseCode} {item.problem.source.year} {item.problem.source.semester}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.problem.topic.color }} />
                        {item.problem.topic.name}
                      </span>
                      <span>·</span>
                      <span>{item.problem.subtopic.name}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                      <Sparkles className="mr-1 inline h-4 w-4 text-ntnu" />
                      {item.explanation}
                    </div>
                    <div className="math-prose mb-4 text-sm text-stone-700">
                      <MathText>{item.problem.problemText}</MathText>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <form action={markProblemAction.bind(null, item.problem.id, ProgressStatus.SOLVED)}>
                        <Button variant="success" className="w-full sm:w-auto">
                          <CheckCircle2 className="h-4 w-4" />
                          Jeg klarte den
                        </Button>
                      </form>
                      <form action={markProblemAction.bind(null, item.problem.id, ProgressStatus.NOT_SOLVED)}>
                        <Button variant="warning" className="w-full sm:w-auto">
                          <XCircle className="h-4 w-4" />
                          Jeg klarte ikke
                        </Button>
                      </form>
                      <Button asChild variant="ghost" className="sm:ml-auto">
                        <Link href={`/oppgaver/${item.problem.id}`}>
                          Åpne oppgave
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <aside className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>Køen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendations.map((item, index) => (
                  <Link key={item.problem.id} href={`/oppgaver/${item.problem.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-stone-50">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {item.problem.topic.name} · {item.problem.subtopic.name}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-ink text-white">
              <CardHeader>
                <CardTitle className="text-white">Scoring i kode</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-stone-300">
                  `adaptivePriorityScore` er summen av fire forklarbare vekter: uløst-rate, lav dekning, nylighet og svakhet i undertema.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </PageShell>
  );
}
