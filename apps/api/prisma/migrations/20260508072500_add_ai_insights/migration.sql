-- CreateEnum
CREATE TYPE "AiInsightStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "status" "AiInsightStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "summary" TEXT,
    "simulatedVotes" JSONB,
    "personaFeedback" JSONB,
    "sources" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_insights_pollId_key" ON "ai_insights"("pollId");

-- CreateIndex
CREATE INDEX "ai_insights_status_idx" ON "ai_insights"("status");

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
