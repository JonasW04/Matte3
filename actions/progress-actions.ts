"use server";

import { ProgressStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markProblemAction(problemId: string, status: ProgressStatus) {
  const user = await requireUser();
  const now = new Date();

  await prisma.userProblemProgress.upsert({
    where: {
      userId_problemId: {
        userId: user.id,
        problemId
      }
    },
    update: {
      status,
      attempts: { increment: 1 },
      lastAttemptedAt: now,
      solvedAt: status === ProgressStatus.SOLVED ? now : null
    },
    create: {
      userId: user.id,
      problemId,
      status,
      attempts: 1,
      lastAttemptedAt: now,
      solvedAt: status === ProgressStatus.SOLVED ? now : null
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/tema");
  revalidatePath("/adaptiv");
}

export async function viewSolutionAction(problemId: string) {
  const user = await requireUser();

  await prisma.userProblemProgress.upsert({
    where: {
      userId_problemId: {
        userId: user.id,
        problemId
      }
    },
    update: {
      solutionViewedAt: new Date()
    },
    create: {
      userId: user.id,
      problemId,
      status: ProgressStatus.NOT_ATTEMPTED,
      solutionViewedAt: new Date()
    }
  });

  revalidatePath(`/oppgaver/${problemId}`);
}

export async function viewSolutionAndRedirectAction(problemId: string, from?: string) {
  await viewSolutionAction(problemId);
  const query = new URLSearchParams({ solution: "1" });
  if (from === "adaptiv") {
    query.set("from", "adaptiv");
  }
  redirect(`/oppgaver/${problemId}?${query.toString()}`);
}
