import { ProgressStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AdaptiveProblem = Prisma.ProblemGetPayload<{
  include: {
    topic: true;
    subtopic: true;
    source: true;
    progress: true;
  };
}>;

export const DEFAULT_ADAPTIVE_RECOMMENDATION_LIMIT = 8;

type TopicStat = {
  topicId: string;
  topicName: string;
  total: number;
  attempted: number;
  notSolved: number;
  lastAttemptedAt: Date | null;
};

export type AdaptiveRecommendation = {
  problem: AdaptiveProblem;
  adaptivePriorityScore: number;
  explanation: string;
  scoreParts: {
    notSolvedRateWeight: number;
    lowCoverageWeight: number;
    recencyWeight: number;
    subtopicWeaknessWeight: number;
  };
};

function daysSince(date: Date | null) {
  if (!date) return 999;
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function explain(parts: AdaptiveRecommendation["scoreParts"], stat: TopicStat, problem: AdaptiveProblem) {
  const best = Object.entries(parts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (best === "notSolvedRateWeight") {
    return `Anbefalt fordi du har flere uløste oppgaver i ${stat.topicName.toLowerCase()}.`;
  }
  if (best === "lowCoverageWeight") {
    return `Anbefalt fordi du har øvd lite på ${stat.topicName.toLowerCase()}.`;
  }
  if (best === "recencyWeight") {
    return `Anbefalt repetisjon: du har ikke jobbet med ${stat.topicName.toLowerCase()} på en stund.`;
  }
  if (best === "subtopicWeaknessWeight") {
    return `Anbefalt fordi nylige feil peker mot ${problem.subtopic.name.toLowerCase()}.`;
  }
  return `Anbefalt for variasjon i ${stat.topicName.toLowerCase()}.`;
}

export async function getAdaptiveRecommendations(
  userId: string,
  limit = DEFAULT_ADAPTIVE_RECOMMENDATION_LIMIT
): Promise<AdaptiveRecommendation[]> {
  const problems = await prisma.problem.findMany({
    include: {
      topic: true,
      subtopic: true,
      source: true,
      progress: { where: { userId } }
    },
    orderBy: [{ topic: { order: "asc" } }, { createdAt: "asc" }]
  });

  const progressRows = await prisma.userProblemProgress.findMany({
    where: { userId },
    orderBy: { lastAttemptedAt: "desc" },
    take: 30,
    include: { problem: true }
  });

  const recentFailedSubtopicIds = new Set(
    progressRows
      .filter((row) => row.status === ProgressStatus.NOT_SOLVED)
      .slice(0, 8)
      .map((row) => row.problem.subtopicId)
  );

  const stats = new Map<string, TopicStat>();
  for (const problem of problems) {
    const current = stats.get(problem.topicId) ?? {
      topicId: problem.topicId,
      topicName: problem.topic.name,
      total: 0,
      attempted: 0,
      notSolved: 0,
      lastAttemptedAt: null
    };
    const progress = problem.progress[0];
    current.total += 1;
    if (progress?.status === ProgressStatus.SOLVED || progress?.status === ProgressStatus.NOT_SOLVED) {
      current.attempted += 1;
    }
    if (progress?.status === ProgressStatus.NOT_SOLVED) {
      current.notSolved += 1;
    }
    if (progress?.lastAttemptedAt && (!current.lastAttemptedAt || progress.lastAttemptedAt > current.lastAttemptedAt)) {
      current.lastAttemptedAt = progress.lastAttemptedAt;
    }
    stats.set(problem.topicId, current);
  }

  const scored = problems
    .filter((problem) => problem.progress[0]?.status !== ProgressStatus.SOLVED)
    .map((problem) => {
      const stat = stats.get(problem.topicId)!;
      const notSolvedRate = stat.attempted ? stat.notSolved / stat.attempted : 0;
      const coverage = stat.total ? stat.attempted / stat.total : 0;
      const staleDays = daysSince(stat.lastAttemptedAt);

      // Scoren holdes enkel og synlig i kode: fire forklarbare ledd, ingen skjult ML.
      const scoreParts = {
        notSolvedRateWeight: notSolvedRate * 4,
        lowCoverageWeight: (1 - coverage) * 2.5,
        recencyWeight: staleDays > 21 ? 2 : staleDays > 10 ? 1.2 : staleDays > 5 ? 0.5 : 0,
        subtopicWeaknessWeight: recentFailedSubtopicIds.has(problem.subtopicId) ? 2 : 0
      };

      const ownProgress = problem.progress[0];
      const ownStatusBoost = ownProgress?.status === ProgressStatus.NOT_SOLVED ? 2.5 : 0;
      const adaptivePriorityScore =
        scoreParts.notSolvedRateWeight +
        scoreParts.lowCoverageWeight +
        scoreParts.recencyWeight +
        scoreParts.subtopicWeaknessWeight +
        ownStatusBoost;

      return {
        problem,
        adaptivePriorityScore,
        scoreParts,
        explanation: explain(scoreParts, stat, problem)
      };
    })
    .sort((a, b) => b.adaptivePriorityScore - a.adaptivePriorityScore);

  const selected: AdaptiveRecommendation[] = [];
  const seenSubtopics = new Set<string>();
  for (const item of scored) {
    if (seenSubtopics.has(item.problem.subtopicId) && selected.length < Math.ceil(limit / 2)) {
      continue;
    }
    selected.push(item);
    seenSubtopics.add(item.problem.subtopicId);
    if (selected.length >= limit) break;
  }

  return selected;
}
