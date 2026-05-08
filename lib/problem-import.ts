import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

export const examProblemImportSchema = z.object({
  source: z.object({
    courseCode: z.string().min(3),
    year: z.coerce.number().int().min(1900),
    semester: z.string().min(1),
    language: z.string().min(1),
    examPdfUrl: z.string().url(),
    solutionPdfUrl: z.string().url().optional().nullable(),
    notes: z.string().optional().nullable()
  }),
  problems: z.array(
    z.object({
      problemNumber: z.string().min(1),
      title: z.string().min(3),
      problemText: z.string().min(3),
      problemImageUrl: z.string().url().optional().nullable(),
      pdfPageRef: z.string().optional().nullable(),
      solutionText: z.string().optional().nullable(),
      solutionPdfUrl: z.string().url().optional().nullable(),
      topicSlug: z.string().min(1),
      subtopicSlug: z.string().min(1),
      hiddenDifficultyScore: z.coerce.number().int().min(1).max(5),
      estimatedMinutes: z.coerce.number().int().min(1).max(180),
      isSeedMock: z.boolean().default(true)
    })
  )
});

export type ExamProblemImport = z.infer<typeof examProblemImportSchema>;

type Db = PrismaClient | Prisma.TransactionClient;

export async function importExamProblems(db: Db, rawPayload: unknown) {
  const payload = examProblemImportSchema.parse(rawPayload);

  const source = await db.examSource.upsert({
    where: {
      courseCode_year_semester_language: {
        courseCode: payload.source.courseCode,
        year: payload.source.year,
        semester: payload.source.semester,
        language: payload.source.language
      }
    },
    update: {
      examPdfUrl: payload.source.examPdfUrl,
      solutionPdfUrl: payload.source.solutionPdfUrl ?? null,
      notes: payload.source.notes ?? null
    },
    create: {
      courseCode: payload.source.courseCode,
      year: payload.source.year,
      semester: payload.source.semester,
      language: payload.source.language,
      examPdfUrl: payload.source.examPdfUrl,
      solutionPdfUrl: payload.source.solutionPdfUrl ?? null,
      notes: payload.source.notes ?? null
    }
  });

  let imported = 0;
  for (const item of payload.problems) {
    const topic = await db.topic.findUnique({ where: { slug: item.topicSlug } });
    if (!topic) {
      throw new Error(`Fant ikke tema med slug "${item.topicSlug}"`);
    }

    const subtopic = await db.subtopic.findUnique({
      where: {
        topicId_slug: {
          topicId: topic.id,
          slug: item.subtopicSlug
        }
      }
    });

    if (!subtopic) {
      throw new Error(`Fant ikke undertema "${item.subtopicSlug}" under "${item.topicSlug}"`);
    }

    await db.problem.upsert({
      where: {
        sourceId_problemNumber: {
          sourceId: source.id,
          problemNumber: item.problemNumber
        }
      },
      update: {
        title: item.title,
        problemText: item.problemText,
        problemImageUrl: item.problemImageUrl ?? null,
        pdfPageRef: item.pdfPageRef ?? null,
        solutionText: item.solutionText ?? null,
        solutionPdfUrl: item.solutionPdfUrl ?? payload.source.solutionPdfUrl ?? null,
        topicId: topic.id,
        subtopicId: subtopic.id,
        hiddenDifficultyScore: item.hiddenDifficultyScore,
        estimatedMinutes: item.estimatedMinutes,
        isSeedMock: item.isSeedMock
      },
      create: {
        sourceId: source.id,
        problemNumber: item.problemNumber,
        title: item.title,
        problemText: item.problemText,
        problemImageUrl: item.problemImageUrl ?? null,
        pdfPageRef: item.pdfPageRef ?? null,
        solutionText: item.solutionText ?? null,
        solutionPdfUrl: item.solutionPdfUrl ?? payload.source.solutionPdfUrl ?? null,
        topicId: topic.id,
        subtopicId: subtopic.id,
        hiddenDifficultyScore: item.hiddenDifficultyScore,
        estimatedMinutes: item.estimatedMinutes,
        isSeedMock: item.isSeedMock
      }
    });
    imported += 1;
  }

  return {
    sourceId: source.id,
    imported
  };
}
