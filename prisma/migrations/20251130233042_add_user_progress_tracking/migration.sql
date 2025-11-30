/*
  Warnings:

  - You are about to drop the column `rehearsalCount` on the `Line` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Line" DROP COLUMN "rehearsalCount";

-- CreateTable
CREATE TABLE "UserCharacterProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "characterId" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "totalLines" INTEGER NOT NULL DEFAULT 0,
    "masteredLines" INTEGER NOT NULL DEFAULT 0,
    "firstPracticedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPracticedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCharacterProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLineProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "lineId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "rehearsalCount" INTEGER NOT NULL DEFAULT 0,
    "hintCount" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "firstPracticedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPracticedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLineProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCharacterProgress_userId_idx" ON "UserCharacterProgress"("userId");

-- CreateIndex
CREATE INDEX "UserCharacterProgress_characterId_idx" ON "UserCharacterProgress"("characterId");

-- CreateIndex
CREATE INDEX "UserCharacterProgress_playbookId_idx" ON "UserCharacterProgress"("playbookId");

-- CreateIndex
CREATE INDEX "UserCharacterProgress_userId_playbookId_idx" ON "UserCharacterProgress"("userId", "playbookId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCharacterProgress_userId_characterId_key" ON "UserCharacterProgress"("userId", "characterId");

-- CreateIndex
CREATE INDEX "UserLineProgress_userId_idx" ON "UserLineProgress"("userId");

-- CreateIndex
CREATE INDEX "UserLineProgress_lineId_idx" ON "UserLineProgress"("lineId");

-- CreateIndex
CREATE INDEX "UserLineProgress_characterId_idx" ON "UserLineProgress"("characterId");

-- CreateIndex
CREATE INDEX "UserLineProgress_playbookId_idx" ON "UserLineProgress"("playbookId");

-- CreateIndex
CREATE INDEX "UserLineProgress_userId_playbookId_idx" ON "UserLineProgress"("userId", "playbookId");

-- CreateIndex
CREATE INDEX "UserLineProgress_userId_characterId_idx" ON "UserLineProgress"("userId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLineProgress_userId_lineId_characterId_key" ON "UserLineProgress"("userId", "lineId", "characterId");

-- AddForeignKey
ALTER TABLE "UserCharacterProgress" ADD CONSTRAINT "UserCharacterProgress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacterProgress" ADD CONSTRAINT "UserCharacterProgress_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLineProgress" ADD CONSTRAINT "UserLineProgress_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLineProgress" ADD CONSTRAINT "UserLineProgress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLineProgress" ADD CONSTRAINT "UserLineProgress_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
