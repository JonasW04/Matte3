-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_ATTEMPTED', 'SOLVED', 'NOT_SOLVED');

-- CreateEnum
CREATE TYPE "PracticeMode" AS ENUM ('TOPIC', 'ADAPTIVE', 'EXAM');

-- CreateEnum
CREATE TYPE "PracticeProblemStatus" AS ENUM ('PENDING', 'SOLVED', 'NOT_SOLVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSource" (
    "id" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "examPdfUrl" TEXT NOT NULL,
    "solutionPdfUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "week" INTEGER,
    "order" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtopic" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Subtopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "problemNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "problemText" TEXT NOT NULL,
    "problemImageUrl" TEXT,
    "pdfPageRef" TEXT,
    "solutionText" TEXT,
    "solutionPdfUrl" TEXT,
    "topicId" TEXT NOT NULL,
    "subtopicId" TEXT NOT NULL,
    "hiddenDifficultyScore" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "isSeedMock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProblemProgress" (
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptedAt" TIMESTAMP(3),
    "solvedAt" TIMESTAMP(3),
    "solutionViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProblemProgress_pkey" PRIMARY KEY ("userId","problemId")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "PracticeMode" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeLimitMinutes" INTEGER,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSessionProblem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "PracticeProblemStatus" NOT NULL DEFAULT 'PENDING',
    "markedAt" TIMESTAMP(3),

    CONSTRAINT "PracticeSessionProblem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ExamSource_courseCode_year_idx" ON "ExamSource"("courseCode", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSource_courseCode_year_semester_language_key" ON "ExamSource"("courseCode", "year", "semester", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_order_idx" ON "Topic"("order");

-- CreateIndex
CREATE INDEX "Subtopic_slug_idx" ON "Subtopic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subtopic_topicId_slug_key" ON "Subtopic"("topicId", "slug");

-- CreateIndex
CREATE INDEX "Problem_topicId_idx" ON "Problem"("topicId");

-- CreateIndex
CREATE INDEX "Problem_subtopicId_idx" ON "Problem"("subtopicId");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_sourceId_problemNumber_key" ON "Problem"("sourceId", "problemNumber");

-- CreateIndex
CREATE INDEX "UserProblemProgress_status_idx" ON "UserProblemProgress"("status");

-- CreateIndex
CREATE INDEX "UserProblemProgress_lastAttemptedAt_idx" ON "UserProblemProgress"("lastAttemptedAt");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_startedAt_idx" ON "PracticeSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "PracticeSession_mode_idx" ON "PracticeSession"("mode");

-- CreateIndex
CREATE INDEX "PracticeSessionProblem_sessionId_order_idx" ON "PracticeSessionProblem"("sessionId", "order");

-- CreateIndex
CREATE INDEX "PracticeSessionProblem_problemId_idx" ON "PracticeSessionProblem"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSessionProblem_sessionId_problemId_key" ON "PracticeSessionProblem"("sessionId", "problemId");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtopic" ADD CONSTRAINT "Subtopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ExamSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProblemProgress" ADD CONSTRAINT "UserProblemProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProblemProgress" ADD CONSTRAINT "UserProblemProgress_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSessionProblem" ADD CONSTRAINT "PracticeSessionProblem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSessionProblem" ADD CONSTRAINT "PracticeSessionProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

