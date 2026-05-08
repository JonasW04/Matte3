import Link from "next/link";
import { ArrowRight, Clock, ExternalLink } from "lucide-react";
import { ProgressStatus, type Problem, type ExamSource, type Subtopic, type Topic } from "@prisma/client";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { MathText } from "@/components/math/math-text";

type ProblemCardProblem = Problem & {
  topic: Topic;
  subtopic: Subtopic;
  source: ExamSource;
};

export function ProblemCard({
  problem,
  status,
  href,
  reason
}: {
  problem: ProblemCardProblem;
  status: ProgressStatus;
  href?: string;
  reason?: string;
}) {
  return (
    <Link
      href={href ?? `/oppgaver/${problem.id}`}
      className="group block rounded-lg border border-stone-200/80 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-stone-300"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-stone-500">
          {problem.source.courseCode} {problem.source.year} {problem.source.semester} · Oppg. {problem.problemNumber}
        </span>
        <StatusBadge status={status} />
        {problem.isSeedMock && <Badge tone="info">Seed/mock</Badge>}
      </div>
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-stone-950">{problem.title}</h3>
          <div className="mt-2 line-clamp-2 text-sm text-stone-600 math-prose">
            <MathText>{problem.problemText}</MathText>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: problem.topic.color }} />
              {problem.topic.name}
            </span>
            <span>·</span>
            <span>{problem.subtopic.name}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {problem.estimatedMinutes} min
            </span>
            {problem.pdfPageRef && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {problem.pdfPageRef}
                </span>
              </>
            )}
          </div>
          {reason && <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">{reason}</p>}
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 transition-all group-hover:translate-x-0.5 group-hover:text-stone-700" />
      </div>
    </Link>
  );
}
