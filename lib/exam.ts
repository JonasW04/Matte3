import { ProgressStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function pickExamProblems(userId: string, count: number) {
  const problems = await prisma.problem.findMany({
    include: {
      progress: { where: { userId } },
      topic: true
    }
  });

  const unsolved = problems.filter((problem) => problem.progress[0]?.status !== ProgressStatus.SOLVED);
  const pool = unsolved.length >= count ? unsolved : problems;

  return pool
    .map((problem) => ({ problem, random: Math.random() }))
    .sort((a, b) => a.random - b.random)
    .slice(0, count)
    .map((item) => item.problem);
}
