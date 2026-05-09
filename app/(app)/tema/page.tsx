import { Search } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { TopicCard } from "@/components/app/topic-card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTopicProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function TopicsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const topics = await prisma.topic.findMany({
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
  });

  const filtered = topics.filter((topic) => {
    if (!query) return true;
    return (
      topic.name.toLowerCase().includes(query) ||
      topic.description.toLowerCase().includes(query) ||
      topic.subtopics.some((subtopic) => subtopic.name.toLowerCase().includes(query))
    );
  });

  return (
    <PageShell>
      <div className="mb-8">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Temaer</div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Velg tema</h1>
        <p className="mt-2 max-w-2xl text-stone-500">Temaene følger fremdriftsplanen for TMA4422 våren 2026.</p>
      </div>

      <form className="mb-5 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Søk i temaer og læringsmål"
            className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 text-sm outline-none transition-colors focus:border-stone-400"
          />
        </div>
        <button className="h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-white">Søk</button>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((topic) => {
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
    </PageShell>
  );
}
