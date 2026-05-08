import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { ProgressStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { ProblemCard } from "@/components/app/problem-card";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTopicProgress, resolveStatus } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
  searchParams
}: {
  params: Promise<{ topicSlug: string }>;
  searchParams: Promise<{ fullforte?: string }>;
}) {
  const user = await requireUser();
  const { topicSlug } = await params;
  const { fullforte } = await searchParams;
  const showCompleted = fullforte === "1";

  const topic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
    include: {
      subtopics: { orderBy: { order: "asc" } },
      problems: {
        include: {
          topic: true,
          subtopic: true,
          source: true,
          progress: { where: { userId: user.id } }
        },
        orderBy: [{ source: { year: "desc" } }, { problemNumber: "asc" }]
      }
    }
  });

  if (!topic) notFound();

  const progress = computeTopicProgress(topic, user.id);
  const problems = showCompleted
    ? topic.problems
    : topic.problems.filter((problem) => resolveStatus(problem.progress[0]) !== ProgressStatus.SOLVED);

  return (
    <PageShell>
      <Link href="/tema" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-950">
        <ArrowLeft className="h-4 w-4" />
        Alle temaer
      </Link>

      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: topic.color }} />
            Uke {topic.week ?? "-"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">{topic.name}</h1>
          <p className="mt-2 max-w-2xl text-stone-500">{topic.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {topic.subtopics.map((subtopic) => (
              <span key={subtopic.id} className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-stone-600 shadow-sm">
                {subtopic.name}
              </span>
            ))}
          </div>
        </div>
        <div className="min-w-56 rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Progresjon</div>
          <div className="text-3xl font-semibold text-stone-950">{progress.percentSolved}%</div>
          <div className="mt-2 text-sm text-stone-500">{progress.solved} av {progress.total} klart</div>
          <ProgressBar value={progress.percentSolved} className="mt-3" indicatorClassName="bg-emerald-600" />
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Klart" value={progress.solved} />
        <StatCard label="Ikke klart" value={progress.notSolved} />
        <StatCard label="Ikke forsøkt" value={progress.notAttempted} />
        <StatCard label="Totalt" value={progress.total} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-stone-950">Oppgaver</h2>
          <p className="text-sm text-stone-500">
            {showCompleted ? "Fullførte oppgaver er synlige." : "Fullførte oppgaver skjules som standard."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={showCompleted ? `/tema/${topic.slug}` : `/tema/${topic.slug}?fullforte=1`}>
            {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showCompleted ? "Skjul fullførte" : "Vis også fullførte"}
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {problems.map((problem) => (
          <ProblemCard
            key={problem.id}
            problem={problem}
            status={resolveStatus(problem.progress[0])}
            href={`/oppgaver/${problem.id}?from=tema&topic=${topic.slug}${showCompleted ? "&fullforte=1" : ""}`}
          />
        ))}
        {problems.length === 0 && (
          <EmptyState title="Ingen oppgaver i denne visningen" text="Slå på fullførte oppgaver eller importer flere eksamensoppgaver for dette temaet." />
        )}
      </div>
    </PageShell>
  );
}
