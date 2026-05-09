ALTER TABLE "UserProblemProgress" ADD COLUMN "lastViewedAt" TIMESTAMP(3);

CREATE INDEX "UserProblemProgress_lastViewedAt_idx" ON "UserProblemProgress"("lastViewedAt");
