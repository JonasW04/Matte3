import { ProgressStatus, type Prisma } from "@prisma/client";

export type ProblemWithMeta = Prisma.ProblemGetPayload<{
  include: {
    topic: true;
    subtopic: true;
    source: true;
    progress: true;
  };
}>;

export type TopicWithCounts = Prisma.TopicGetPayload<{
  include: {
    subtopics: true;
    problems: {
      include: {
        progress: true;
      };
    };
  };
}>;

export function resolveStatus(progress?: { status: ProgressStatus } | null) {
  return progress?.status ?? ProgressStatus.NOT_ATTEMPTED;
}

export function getProblemStatus(problem: ProblemWithMeta, userId: string) {
  return resolveStatus(problem.progress.find((item) => item.userId === userId));
}

type ContinueProblemCandidate = {
  progress: Array<{
    status: ProgressStatus;
    lastViewedAt?: Date | null;
    lastAttemptedAt?: Date | null;
    solutionViewedAt?: Date | null;
  }>;
};

function latestActivityTime(progress: ContinueProblemCandidate["progress"][number]) {
  const timestamps = [progress.lastViewedAt, progress.lastAttemptedAt, progress.solutionViewedAt]
    .filter((value): value is Date => Boolean(value))
    .map((value) => value.getTime());

  return timestamps.length > 0 ? Math.max(...timestamps) : null;
}

export function selectContinueProblem<T extends ContinueProblemCandidate>(problems: T[]) {
  let latestActive: { problem: T; time: number } | null = null;
  let firstUnresolved: T | null = null;
  let firstUntouched: T | null = null;

  for (const problem of problems) {
    const progress = problem.progress[0];
    const status = resolveStatus(progress);

    if (status === ProgressStatus.SOLVED) continue;

    if (status === ProgressStatus.NOT_SOLVED && !firstUnresolved) {
      firstUnresolved = problem;
    }

    if (status === ProgressStatus.NOT_ATTEMPTED && !firstUntouched) {
      firstUntouched = problem;
    }

    if (!progress) continue;

    const time = latestActivityTime(progress);
    if (time !== null && (!latestActive || time > latestActive.time)) {
      latestActive = { problem, time };
    }
  }

  return latestActive?.problem ?? firstUnresolved ?? firstUntouched;
}

export function statusLabel(status: ProgressStatus) {
  switch (status) {
    case ProgressStatus.SOLVED:
      return "Klart";
    case ProgressStatus.NOT_SOLVED:
      return "Ikke klart";
    default:
      return "Ikke forsøkt";
  }
}

export function statusTone(status: ProgressStatus) {
  switch (status) {
    case ProgressStatus.SOLVED:
      return "success";
    case ProgressStatus.NOT_SOLVED:
      return "warning";
    default:
      return "neutral";
  }
}

export function computeGlobalProgress(
  problems: Array<{
    id: string;
    topicId: string;
    progress: Array<{ userId: string; status: ProgressStatus }>;
  }>,
  userId: string
) {
  const total = problems.length;
  const solved = problems.filter((problem) => resolveStatus(problem.progress.find((p) => p.userId === userId)) === ProgressStatus.SOLVED).length;
  const notSolved = problems.filter((problem) => resolveStatus(problem.progress.find((p) => p.userId === userId)) === ProgressStatus.NOT_SOLVED).length;
  const attempted = solved + notSolved;

  return {
    total,
    solved,
    notSolved,
    attempted,
    percentSolved: total ? Math.round((solved / total) * 100) : 0,
    percentAttempted: total ? Math.round((attempted / total) * 100) : 0
  };
}

export function computeTopicProgress(topic: TopicWithCounts, userId: string) {
  const total = topic.problems.length;
  const solved = topic.problems.filter((problem) => resolveStatus(problem.progress.find((p) => p.userId === userId)) === ProgressStatus.SOLVED).length;
  const notSolved = topic.problems.filter((problem) => resolveStatus(problem.progress.find((p) => p.userId === userId)) === ProgressStatus.NOT_SOLVED).length;
  const attempted = solved + notSolved;

  return {
    total,
    solved,
    notSolved,
    attempted,
    notAttempted: total - attempted,
    percentSolved: total ? Math.round((solved / total) * 100) : 0,
    percentAttempted: total ? Math.round((attempted / total) * 100) : 0
  };
}

export function recommendationText(input: {
  topicName: string;
  total: number;
  attempted: number;
  notSolved: number;
  lastAttemptedAt?: Date | null;
}) {
  if (input.notSolved >= 2) {
    return `Anbefalt fordi du har flere uløste oppgaver i ${input.topicName.toLowerCase()}.`;
  }
  if (input.attempted <= Math.max(1, Math.floor(input.total * 0.25))) {
    return `Anbefalt fordi du har øvd lite på ${input.topicName.toLowerCase()}.`;
  }
  if (!input.lastAttemptedAt) {
    return `Anbefalt som første runde i ${input.topicName.toLowerCase()}.`;
  }

  const days = Math.floor((Date.now() - input.lastAttemptedAt.getTime()) / (24 * 60 * 60 * 1000));
  if (days >= 10) {
    return `Anbefalt repetisjon: du har ikke jobbet med ${input.topicName.toLowerCase()} på en stund.`;
  }

  return `Anbefalt for jevn progresjon i ${input.topicName.toLowerCase()}.`;
}
