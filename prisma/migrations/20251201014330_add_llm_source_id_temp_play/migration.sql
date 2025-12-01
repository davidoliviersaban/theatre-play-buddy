-- AlterTable
ALTER TABLE "Act" ADD COLUMN     "llmSourceId" VARCHAR(64);

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "llmSourceId" VARCHAR(64);

-- AlterTable
ALTER TABLE "Line" ADD COLUMN     "llmSourceId" VARCHAR(64);

-- AlterTable
ALTER TABLE "Playbook" ADD COLUMN     "llmSourceId" VARCHAR(64);

-- AlterTable
ALTER TABLE "Scene" ADD COLUMN     "llmSourceId" VARCHAR(64);

-- CreateTable
CREATE TABLE "PlayTemp" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "year" INTEGER,
    "genre" TEXT,
    "description" TEXT,
    "llmSourceId" VARCHAR(64),
    "rawJson" JSONB NOT NULL,
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayTemp_pkey" PRIMARY KEY ("id")
);
