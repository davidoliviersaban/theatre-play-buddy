-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('PARSE_PLAY');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'running', 'paused', 'retrying', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "ParseJob" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL DEFAULT 'PARSE_PLAY',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "rawText" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "config" JSONB,
    "playbookId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "checkpoints" JSONB NOT NULL DEFAULT '[]',
    "currentState" JSONB,
    "totalChunks" INTEGER,
    "completedChunks" INTEGER NOT NULL DEFAULT 0,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "failureReason" TEXT,
    "workerId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParseJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParseJob_status_priority_createdAt_idx" ON "ParseJob"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "ParseJob_workerId_idx" ON "ParseJob"("workerId");

-- CreateIndex
CREATE INDEX "ParseJob_playbookId_idx" ON "ParseJob"("playbookId");
