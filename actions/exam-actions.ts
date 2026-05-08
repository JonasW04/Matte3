"use server";

import { PracticeMode, PracticeProblemStatus, ProgressStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { pickExamProblems } from "@/lib/exam";
import { prisma } from "@/lib/prisma";

const startExamSchema = z.object({
  count: z.coerce.number().int().refine((value) => [5, 8, 10].includes(value), "Velg 5, 8 eller 10 oppgaver."),
  timeLimitMinutes: z
    .string()
    .optional()
    .transform((value) => (value && value !== "none" ? Number(value) : null))
    .refine((value) => value === null || [15, 30, 45, 60, 90].includes(value), "Ugyldig tidsbegrensning.")
});

function toProgressStatus(status: PracticeProblemStatus) {
  return status === PracticeProblemStatus.SOLVED ? ProgressStatus.SOLVED : ProgressStatus.NOT_SOLVED;
}

export async function startExamSessionAction(formData: FormData) {
  const user = await requireUser();
  const parsed = startExamSchema.parse(Object.fromEntries(formData));
  const problems = await pickExamProblems(user.id, parsed.count);

  const session = await prisma.practiceSession.create({
    data: {
      userId: user.id,
      mode: PracticeMode.EXAM,
      timeLimitMinutes: parsed.timeLimitMinutes,
      problems: {
        create: problems.map((problem, index) => ({
          problemId: problem.id,
          order: index + 1
        }))
      }
    }
  });

  redirect(`/eksamen/${session.id}`);
}

export async function markExamProblemAction(sessionId: string, problemId: string, status: PracticeProblemStatus) {
  const user = await requireUser();
  const now = new Date();

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: user.id },
    select: { id: true }
  });
  if (!session) redirect("/eksamen");

  await prisma.$transaction([
    prisma.practiceSessionProblem.update({
      where: {
        sessionId_problemId: {
          sessionId,
          problemId
        }
      },
      data: {
        status,
        markedAt: now
      }
    }),
    prisma.userProblemProgress.upsert({
      where: {
        userId_problemId: {
          userId: user.id,
          problemId
        }
      },
      update: {
        status: toProgressStatus(status),
        attempts: { increment: 1 },
        lastAttemptedAt: now,
        solvedAt: status === PracticeProblemStatus.SOLVED ? now : null
      },
      create: {
        userId: user.id,
        problemId,
        status: toProgressStatus(status),
        attempts: 1,
        lastAttemptedAt: now,
        solvedAt: status === PracticeProblemStatus.SOLVED ? now : null
      }
    })
  ]);

  revalidatePath(`/eksamen/${sessionId}`);
  revalidatePath(`/eksamen/${sessionId}/resultat`);
  revalidatePath("/dashboard");
}

export async function completeExamSessionAction(sessionId: string) {
  const user = await requireUser();
  await prisma.practiceSession.updateMany({
    where: { id: sessionId, userId: user.id },
    data: { completedAt: new Date() }
  });

  redirect(`/eksamen/${sessionId}/resultat`);
}

export async function completeExamSessionById(sessionId: string, userId: string) {
  await prisma.practiceSession.updateMany({
    where: { id: sessionId, userId },
    data: { completedAt: new Date() }
  });
}
