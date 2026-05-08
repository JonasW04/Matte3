import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import tma4100 from "../data/exam-problems/tma4100-2024-h.json";
import tma4110 from "../data/exam-problems/tma4110-2024-h.json";
import tma4130 from "../data/exam-problems/tma4130-2024-h.json";
import { TOPIC_STRUCTURE, slugifyNorwegian } from "../lib/course-structure";
import { importExamProblems } from "../lib/problem-import";

const prisma = new PrismaClient();

async function main() {
  for (const topicSeed of TOPIC_STRUCTURE) {
    const topic = await prisma.topic.upsert({
      where: { slug: topicSeed.slug },
      update: {
        name: topicSeed.name,
        week: topicSeed.week,
        order: topicSeed.order,
        color: topicSeed.color,
        description: topicSeed.description
      },
      create: {
        slug: topicSeed.slug,
        name: topicSeed.name,
        week: topicSeed.week,
        order: topicSeed.order,
        color: topicSeed.color,
        description: topicSeed.description
      }
    });

    for (const [index, subtopicName] of topicSeed.subtopics.entries()) {
      await prisma.subtopic.upsert({
        where: {
          topicId_slug: {
            topicId: topic.id,
            slug: slugifyNorwegian(subtopicName)
          }
        },
        update: {
          name: subtopicName,
          order: index + 1
        },
        create: {
          topicId: topic.id,
          slug: slugifyNorwegian(subtopicName),
          name: subtopicName,
          order: index + 1
        }
      });
    }
  }

  await importExamProblems(prisma, tma4110);
  await importExamProblems(prisma, tma4130);
  await importExamProblems(prisma, tma4100);

  const adminPassword = await bcrypt.hash("matte3-demo", 12);
  const userPassword = await bcrypt.hash("student-demo", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@matte3.local" },
    update: {
      name: "Admin",
      passwordHash: adminPassword,
      role: Role.ADMIN
    },
    create: {
      email: "admin@matte3.local",
      name: "Admin",
      passwordHash: adminPassword,
      role: Role.ADMIN
    }
  });

  const student = await prisma.user.upsert({
    where: { email: "student@matte3.local" },
    update: {
      name: "Ingrid Solheim",
      passwordHash: userPassword,
      role: Role.USER
    },
    create: {
      email: "student@matte3.local",
      name: "Ingrid Solheim",
      passwordHash: userPassword,
      role: Role.USER
    }
  });

  const sampleProblems = await prisma.problem.findMany({
    orderBy: [{ topic: { order: "asc" } }, { problemNumber: "asc" }],
    take: 10
  });

  for (const [index, problem] of sampleProblems.entries()) {
    const solved = index % 3 === 0;
    const notSolved = index % 3 === 1;
    if (!solved && !notSolved) continue;

    await prisma.userProblemProgress.upsert({
      where: {
        userId_problemId: {
          userId: student.id,
          problemId: problem.id
        }
      },
      update: {
        status: solved ? "SOLVED" : "NOT_SOLVED",
        attempts: 1,
        lastAttemptedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        solvedAt: solved ? new Date(Date.now() - index * 24 * 60 * 60 * 1000) : null
      },
      create: {
        userId: student.id,
        problemId: problem.id,
        status: solved ? "SOLVED" : "NOT_SOLVED",
        attempts: 1,
        lastAttemptedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        solvedAt: solved ? new Date(Date.now() - index * 24 * 60 * 60 * 1000) : null
      }
    });
  }

  console.log("Seed ferdig");
  console.log("Demo admin: admin@matte3.local / matte3-demo");
  console.log("Demo student: student@matte3.local / student-demo");
  console.log(`Seedet ${admin.email} og ${student.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
