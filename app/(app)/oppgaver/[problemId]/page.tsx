import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Eye, XCircle } from "lucide-react";
import { ProgressStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { markProblemAction, viewSolutionAndRedirectAction } from "@/actions/progress-actions";
import { PageShell } from "@/components/app/page-shell";
import { MathText } from "@/components/math/math-text";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdaptiveRecommendations } from "@/lib/adaptive";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveStatus } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function ProblemPage({
  params,
  searchParams
}: {
  params: Promise<{ problemId: string }>;
  searchParams: Promise<{ solution?: string; from?: string; topic?: string; fullforte?: string }>;
}) {
  const user = await requireUser();
  const { problemId } = await params;
  const { solution, from, topic, fullforte } = await searchParams;
  const showSolution = solution === "1";
  const fromAdaptive = from === "adaptiv";
  const fromTopic = from === "tema" && typeof topic === "string" && topic.length > 0;
  const showCompletedInTopic = fullforte === "1";

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      topic: true,
      subtopic: true,
      source: true,
      progress: { where: { userId: user.id } }
    }
  });

  if (!problem) notFound();

  const status = resolveStatus(problem.progress[0]);
  const backHref = fromAdaptive
    ? "/adaptiv"
    : fromTopic
      ? `/tema/${topic}${showCompletedInTopic ? "?fullforte=1" : ""}`
      : `/tema/${problem.topic.slug}`;
  const backLabel = fromAdaptive ? "Til adaptiv øving" : fromTopic ? "Til tema" : `Til ${problem.topic.name}`;
  let nextProblemHref: string | null = null;

  if (fromAdaptive) {
    const recommendations = await getAdaptiveRecommendations(user.id, 8);
    const currentIndex = recommendations.findIndex((item) => item.problem.id === problem.id);
    const nextProblem = currentIndex >= 0 ? recommendations[currentIndex + 1] : null;
    if (nextProblem) {
      nextProblemHref = `/oppgaver/${nextProblem.problem.id}?from=adaptiv`;
    }
  }

  if (!nextProblemHref && fromTopic) {
    const topicProblems = await prisma.problem.findMany({
      where: { topic: { slug: topic } },
      include: {
        progress: { where: { userId: user.id } }
      },
      orderBy: [{ source: { year: "desc" } }, { problemNumber: "asc" }]
    });
    const visibleProblems = showCompletedInTopic
      ? topicProblems
      : topicProblems.filter((topicProblem) => resolveStatus(topicProblem.progress[0]) !== ProgressStatus.SOLVED);
    const currentIndex = visibleProblems.findIndex((topicProblem) => topicProblem.id === problem.id);
    const nextProblem = currentIndex >= 0 ? visibleProblems[currentIndex + 1] : null;
    if (nextProblem) {
      nextProblemHref = `/oppgaver/${nextProblem.id}?from=tema&topic=${topic}${showCompletedInTopic ? "&fullforte=1" : ""}`;
    }
  }

  return (
    <PageShell width="medium">
      <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-950">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="info">{problem.source.courseCode}</Badge>
          <StatusBadge status={status} />
          {problem.isSeedMock && <Badge tone="warning">Seed/mock</Badge>}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{problem.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <span>{problem.source.year} {problem.source.semester}</span>
          <span>·</span>
          <span>Oppgave {problem.problemNumber}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: problem.topic.color }} />
            {problem.topic.name}
          </span>
          <span>·</span>
          <span>{problem.subtopic.name}</span>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <a
          href={problem.source.examPdfUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4 text-sm font-semibold text-stone-700 shadow-soft hover:border-stone-300"
        >
          Eksamens-PDF {problem.pdfPageRef ? `· ${problem.pdfPageRef}` : ""}
          <ExternalLink className="h-4 w-4 text-stone-400" />
        </a>
        {(problem.solutionPdfUrl || problem.source.solutionPdfUrl) && (
          <a
            href={problem.solutionPdfUrl ?? problem.source.solutionPdfUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4 text-sm font-semibold text-stone-700 shadow-soft hover:border-stone-300"
          >
            Løsningsforslag-PDF
            <ExternalLink className="h-4 w-4 text-stone-400" />
          </a>
        )}
      </div>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Oppgavetekst</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="math-prose text-base text-stone-800">
            <MathText>{problem.problemText}</MathText>
          </div>
        </CardContent>
      </Card>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <form action={markProblemAction.bind(null, problem.id, ProgressStatus.SOLVED)}>
          <Button variant={status === ProgressStatus.SOLVED ? "success" : "outline"} className="w-full sm:w-auto">
            <CheckCircle2 className="h-4 w-4" />
            Jeg klarte den
          </Button>
        </form>
        <form action={markProblemAction.bind(null, problem.id, ProgressStatus.NOT_SOLVED)}>
          <Button variant={status === ProgressStatus.NOT_SOLVED ? "warning" : "outline"} className="w-full sm:w-auto">
            <XCircle className="h-4 w-4" />
            Jeg klarte ikke denne
          </Button>
        </form>
        {!showSolution && (
          <form action={viewSolutionAndRedirectAction.bind(null, problem.id, from, topic, showCompletedInTopic ? "1" : undefined)} className="sm:ml-auto">
            <Button variant="default" className="w-full sm:w-auto">
              <Eye className="h-4 w-4" />
              Vis løsningsforslag
            </Button>
          </form>
        )}
        {nextProblemHref && (
          <Button asChild variant="outline" className={showSolution ? "sm:ml-auto" : ""}>
            <Link href={nextProblemHref}>
              Neste oppgave
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {showSolution && (
        <Card className="border-stone-300 bg-gradient-to-b from-white to-stone-50">
          <CardHeader>
            <CardTitle>Løsningsforslag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="math-prose text-base text-stone-800">
              <MathText>{problem.solutionText ?? "Løsningsforslaget er ikke importert ennå. Bruk PDF-lenken over."}</MathText>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
