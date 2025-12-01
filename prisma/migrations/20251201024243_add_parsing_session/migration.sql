/*
  Warnings:

  - A unique constraint covering the columns `[llmSourceId]` on the table `Playbook` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ParsingStatus" AS ENUM ('pending', 'warming', 'parsing', 'completed', 'failed', 'aborted');

-- AlterTable
ALTER TABLE "Act" ALTER COLUMN "llmSourceId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Character" ALTER COLUMN "llmSourceId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Line" ALTER COLUMN "llmSourceId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Playbook" ALTER COLUMN "llmSourceId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Scene" ALTER COLUMN "llmSourceId" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "ParsingSession" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "status" "ParsingStatus" NOT NULL DEFAULT 'pending',
    "currentChunk" INTEGER NOT NULL DEFAULT 0,
    "totalChunks" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "ParsingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParsingSession_playbookId_idx" ON "ParsingSession"("playbookId");

-- CreateIndex
CREATE INDEX "ParsingSession_status_idx" ON "ParsingSession"("status");

-- CreateIndex
CREATE INDEX "ParsingSession_startedAt_idx" ON "ParsingSession"("startedAt");

-- CreateIndex
CREATE INDEX "Act_llmSourceId_idx" ON "Act"("llmSourceId");

-- CreateIndex
CREATE INDEX "Character_llmSourceId_idx" ON "Character"("llmSourceId");

-- CreateIndex
CREATE INDEX "Line_llmSourceId_idx" ON "Line"("llmSourceId");

-- CreateIndex
CREATE INDEX "Playbook_llmSourceId_idx" ON "Playbook"("llmSourceId");

-- CreateIndex
CREATE INDEX "Scene_llmSourceId_idx" ON "Scene"("llmSourceId");
