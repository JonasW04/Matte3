import Link from "next/link";
import { CheckCircle2, ClipboardList, XCircle } from "lucide-react";
import { PracticeProblemStatus } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { completeExamSessionAction, markExamProblemAction } from "@/actions/exam-actions";
import { PageShell } from "@/components/app/page-shell";
import { ExamTimer } from "@/components/exam/exam-timer";
import { MathText } from "@/components/math/math-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ExamSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
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
  if (session.completedAt) redirect(`/eksamen/${session.id}/resultat`);

  const marked = session.problems.filter((item) => item.status !== PracticeProblemStatus.PENDING).length;

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
            <ClipboardList className="h-4 w-4" />
            Eksamensøkt
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Oppgaver</h1>
          <p className="mt-2 text-stone-500">{marked} av {session.problems.length} oppgaver markert.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExamTimer sessionId={session.id} startedAt={session.startedAt.toISOString()} timeLimitMinutes={session.timeLimitMinutes} />
          <form action={completeExamSessionAction.bind(null, session.id)}>
            <Button variant="ntnu">Lever økt</Button>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {session.problems.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="info">Oppgave {item.order}</Badge>
                <Badge tone={item.status === "SOLVED" ? "success" : item.status === "NOT_SOLVED" ? "warning" : "neutral"}>
                  {item.status === "SOLVED" ? "Klart" : item.status === "NOT_SOLVED" ? "Ikke klart" : "Ikke markert"}
                </Badge>
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
              <div className="math-prose mb-4 text-sm text-stone-700">
                <MathText>{item.problem.problemText}</MathText>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <form action={markExamProblemAction.bind(null, session.id, item.problemId, PracticeProblemStatus.SOLVED)}>
                  <Button variant={item.status === PracticeProblemStatus.SOLVED ? "success" : "outline"} className="w-full sm:w-auto">
                    <CheckCircle2 className="h-4 w-4" />
                    Jeg klarte den
                  </Button>
                </form>
                <form action={markExamProblemAction.bind(null, session.id, item.problemId, PracticeProblemStatus.NOT_SOLVED)}>
                  <Button variant={item.status === PracticeProblemStatus.NOT_SOLVED ? "warning" : "outline"} className="w-full sm:w-auto">
                    <XCircle className="h-4 w-4" />
                    Jeg klarte ikke denne
                  </Button>
                </form>
                <span className="text-sm text-stone-500 sm:ml-auto">Løsningsforslag er skjult under økten.</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <Button asChild variant="ghost">
          <Link href="/eksamen">Avbryt</Link>
        </Button>
        <form action={completeExamSessionAction.bind(null, session.id)}>
          <Button variant="ntnu">Fullfør og se resultat</Button>
        </form>
      </div>
    </PageShell>
  );
}
