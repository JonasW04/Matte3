import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ensureCourseStructure } from "../lib/course-seed";
import { importExamProblems } from "../lib/problem-import";

const prisma = new PrismaClient();

async function importRelevantProblemFiles() {
  const problemDir = path.join(process.cwd(), "data", "exam-problems");
  const files = (await readdir(problemDir)).filter((file) => file.endsWith("-relevant.json")).sort();

  for (const file of files) {
    const raw = await readFile(path.join(problemDir, file), "utf8");
    await importExamProblems(prisma, JSON.parse(raw));
  }

  return files.length;
}

async function main() {
  await ensureCourseStructure(prisma);

  const importedFiles = await importRelevantProblemFiles();

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
    where: { isSeedMock: false },
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
  console.log(`Importerte relevante oppgavefiler: ${importedFiles}`);
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
