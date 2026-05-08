import Link from "next/link";
import { ArrowRight, Brain, CheckCircle2, XCircle } from "lucide-react";
import { PracticeProblemStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { StatCard } from "@/components/app/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatShortDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExamResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const user = await requireUser();
  const { sessionId } = await params;

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: {
      problems: {
        include: {
          problem: {
            include: {
              topic: true,
              subtopic: true,
              source: true
            }
          }
        },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!session) notFound();

  const solved = session.problems.filter((item) => item.status === PracticeProblemStatus.SOLVED).length;
  const notSolved = session.problems.filter((item) => item.status === PracticeProblemStatus.NOT_SOLVED).length;
  const pending = session.problems.length - solved - notSolved;
  const percent = session.problems.length ? Math.round((solved / session.problems.length) * 100) : 0;

  const topicErrors = new Map<string, { name: string; slug: string; color: string; count: number }>();
  for (const item of session.problems) {
    if (item.status !== PracticeProblemStatus.NOT_SOLVED) continue;
    const current = topicErrors.get(item.problem.topicId) ?? {
      name: item.problem.topic.name,
      slug: item.problem.topic.slug,
      color: item.problem.topic.color,
      count: 0
    };
    current.count += 1;
    topicErrors.set(item.problem.topicId, current);
  }
  const weakTopics = [...topicErrors.values()].sort((a, b) => b.count - a.count);

  return (
    <PageShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Eksamensøkt fullført</div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Resultat</h1>
          <p className="mt-2 text-stone-500">Startet {formatShortDateTime(session.startedAt)}.</p>
        </div>
        <Button asChild variant="ntnu">
          <Link href="/adaptiv">
            <Brain className="h-4 w-4" />
            Start adaptiv øving basert på dette
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Klart" value={solved} sub={`av ${session.problems.length}`} />
        <StatCard label="Ikke klart" value={notSolved} sub="brukes i adaptive forslag" />
        <StatCard label="Ikke markert" value={pending} sub="kan følges opp senere" />
        <StatCard label="Score" value={`${percent}%`} sub="selvrapportert" />
      </div>

      <div className="mb-8 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-stone-800">Øktprogresjon</span>
          <span className="text-stone-500">{solved}/{session.problems.length}</span>
        </div>
        <ProgressBar value={percent} indicatorClassName="bg-emerald-600" />
      </div>

      <div className="mb-8 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Temaer med flest feil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weakTopics.length === 0 && <p className="text-sm text-stone-500">Ingen temaer med feil i denne økten.</p>}
            {weakTopics.map((topic) => (
              <Link key={topic.slug} href={`/tema/${topic.slug}`} className="flex items-center gap-3 rounded-lg p-3 hover:bg-stone-50">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: topic.color }} />
                <span className="flex-1 font-semibold text-stone-900">{topic.name}</span>
                <Badge tone="warning">{topic.count} feil</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-ink text-white">
          <CardHeader>
            <CardTitle className="text-white">Neste anbefaling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm leading-relaxed text-stone-300">
              Adaptive forslag vekter temaene du nettopp markerte som ikke klart, og blander inn oppgaver du har øvd lite på.
            </p>
            <Button asChild variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
              <Link href="/adaptiv">
                Åpne adaptiv kø
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detaljer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-stone-100">
            {session.problems.map((item) => (
              <Link key={item.id} href={`/oppgaver/${item.problemId}?solution=1`} className="flex items-center gap-3 py-3 hover:bg-stone-50">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-stone-100">
                  {item.status === PracticeProblemStatus.SOLVED ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  ) : item.status === PracticeProblemStatus.NOT_SOLVED ? (
                    <XCircle className="h-4 w-4 text-amber-700" />
                  ) : (
                    <span className="text-stone-400">·</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-stone-900">{item.problem.title}</div>
                  <div className="text-xs text-stone-500">
                    {item.problem.topic.name} · {item.problem.subtopic.name}
                  </div>
                </div>
                <span className="text-xs font-semibold text-stone-500">Vis løsning</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
