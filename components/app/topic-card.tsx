import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Topic } from "@prisma/client";
import { ProgressBar } from "@/components/ui/progress";

export function TopicCard({
  topic,
  solved,
  notSolved,
  total,
  subtopics
}: {
  topic: Topic;
  solved: number;
  notSolved: number;
  total: number;
  subtopics: string[];
}) {
  const percent = total ? Math.round((solved / total) * 100) : 0;

  return (
    <Link
      href={`/tema/${topic.slug}`}
      className="group block rounded-lg border border-stone-200/80 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-stone-300"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg text-sm font-bold" style={{ backgroundColor: `${topic.color}22` }}>
            {topic.order}
          </div>
          <div>
            <h3 className="font-semibold text-stone-950">{topic.name}</h3>
            <p className="text-xs text-stone-500">Uke {topic.week ?? "-"} · {total} oppgaver</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-stone-300 transition-all group-hover:translate-x-0.5 group-hover:text-stone-700" />
      </div>
      <p className="mb-4 text-sm leading-relaxed text-stone-600">{topic.description}</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {subtopics.slice(0, 4).map((subtopic) => (
          <span key={subtopic} className="rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-600">
            {subtopic}
          </span>
        ))}
      </div>
      <ProgressBar value={percent} indicatorClassName="bg-emerald-600" />
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-emerald-700">{solved} klart</span>
        {notSolved > 0 ? <span className="font-medium text-amber-700">{notSolved} ikke klart</span> : <span className="text-stone-400">{percent}%</span>}
      </div>
    </Link>
  );
}
