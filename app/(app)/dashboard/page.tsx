import Link from "next/link";
import { ArrowRight, Brain, ClipboardList } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { ProblemCard } from "@/components/app/problem-card";
import { StatCard } from "@/components/app/stat-card";
import { TopicCard } from "@/components/app/topic-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeGlobalProgress, computeTopicProgress, recommendationText, resolveStatus, selectContinueProblem } from "@/lib/progress";
import { formatShortDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const [topics, problems, sessions] = await Promise.all([
    prisma.topic.findMany({
      include: {
        subtopics: { orderBy: { order: "asc" } },
        problems: {
          where: { isSeedMock: false },
          include: {
            progress: { where: { userId: user.id } }
          }
        }
      },
      orderBy: { order: "asc" }
    }),
    prisma.problem.findMany({
      where: { isSeedMock: false },
      include: {
        topic: true,
        subtopic: true,
        source: true,
        progress: { where: { userId: user.id } }
      },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.practiceSession.findMany({
      where: { userId: user.id },
      include: { problems: true },
      orderBy: { startedAt: "desc" },
      take: 5
    })
  ]);

  const stats = computeGlobalProgress(problems, user.id);
  const continueProblem = selectContinueProblem(problems);

  const recommended = topics
    .map((topic) => {
      const progress = computeTopicProgress(topic, user.id);
      const lastAttemptedAt =
        topic.problems
          .flatMap((problem) => problem.progress.map((row) => row.lastAttemptedAt))
          .filter(Boolean)
          .sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null;
      return {
        topic,
        progress,
        reason: recommendationText({
          topicName: topic.name,
          total: progress.total,
          attempted: progress.attempted,
          notSolved: progress.notSolved,
          lastAttemptedAt
        }),
        score: progress.notSolved * 3 + (progress.total - progress.attempted) + (lastAttemptedAt ? 0 : 2)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <PageShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Dashboard</div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Hei, {user.name.split(" ")[0]}.</h1>
          <p className="mt-2 max-w-2xl text-stone-500">
            Progresjonen din er lagret, og oppgavene er koblet til temaene i TMA4422.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/adaptiv">
              <Brain className="h-4 w-4" />
              Adaptiv øving
            </Link>
          </Button>
          <Button asChild variant="ntnu">
            <Link href="/eksamen">
              <ClipboardList className="h-4 w-4" />
              Start eksamen
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Klart" value={stats.solved} sub={`av ${stats.total} oppgaver`} />
        <StatCard label="Ikke klart" value={stats.notSolved} sub="prioriteres adaptivt" />
        <StatCard label="Forsøkt" value={stats.attempted} sub={`${stats.percentAttempted}% av oppgavebanken`} />
        <StatCard label="Total progresjon" value={`${stats.percentSolved}%`} sub="basert på løste oppgaver" />
      </div>

      <div className="mb-8 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Fortsett der du slapp</CardTitle>
          </CardHeader>
          <CardContent>
            {continueProblem ? (
              <ProblemCard problem={continueProblem} status={resolveStatus(continueProblem.progress[0])} />
            ) : (
              <div className="rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                Du har markert alle importerte oppgaver som klart.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-ink text-white">
          <CardHeader>
            <CardTitle className="text-white">Anbefalt nå</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-stone-300">{recommended[0]?.reason ?? "Importer flere oppgaver for bedre anbefalinger."}</p>
            {recommended[0] && (
              <Button asChild variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                <Link href={`/tema/${recommended[0].topic.slug}`}>
                  Åpne {recommended[0].topic.name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-stone-950">Progresjon per tema</h2>
            <p className="text-sm text-stone-500">Klikk et tema for å åpne oppgavelista.</p>
          </div>
          <Link href="/tema" className="flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-stone-950">
            Alle temaer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topics.slice(0, 6).map((topic) => {
            const progress = computeTopicProgress(topic, user.id);
            return (
              <TopicCard
                key={topic.id}
                topic={topic}
                solved={progress.solved}
                notSolved={progress.notSolved}
                total={progress.total}
                subtopics={topic.subtopics.map((subtopic) => subtopic.name)}
              />
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Anbefalte temaer å øve på</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommended.map((item) => (
              <Link key={item.topic.id} href={`/tema/${item.topic.slug}`} className="block rounded-lg border border-stone-100 p-3 transition-colors hover:bg-stone-50">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-semibold text-stone-900">{item.topic.name}</div>
                  <div className="text-xs text-stone-500">{item.progress.solved}/{item.progress.total}</div>
                </div>
                <ProgressBar value={item.progress.percentSolved} indicatorClassName="bg-ntnu" />
                <p className="mt-2 text-sm text-stone-500">{item.reason}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Siste økter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-stone-100">
              {sessions.length === 0 && <p className="text-sm text-stone-500">Ingen økter ennå.</p>}
              {sessions.map((session) => {
                const solved = session.problems.filter((problem) => problem.status === "SOLVED").length;
                return (
                  <Link key={session.id} href={session.mode === "EXAM" ? `/eksamen/${session.id}/resultat` : "/dashboard"} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-stone-900">
                        {session.mode === "EXAM" ? "Eksamensøkt" : session.mode === "ADAPTIVE" ? "Adaptiv økt" : "Temaøkt"}
                      </div>
                      <div className="text-xs text-stone-500">{formatShortDateTime(session.startedAt)}</div>
                    </div>
                    <div className="text-sm tabular-nums text-stone-600">
                      <span className="font-semibold text-emerald-700">{solved}</span> / {session.problems.length}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
