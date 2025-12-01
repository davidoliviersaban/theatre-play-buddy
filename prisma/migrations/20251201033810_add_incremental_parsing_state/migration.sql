/*
  Warnings:

  - You are about to drop the `PlayTemp` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ParsingSession" ADD COLUMN     "author" TEXT,
ADD COLUMN     "currentActIndex" INTEGER,
ADD COLUMN     "currentCharacters" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "currentLineIndex" INTEGER,
ADD COLUMN     "currentSceneIndex" INTEGER,
ADD COLUMN     "currentState" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "totalActs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCharacters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalLines" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalScenes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "year" INTEGER;

-- DropTable
DROP TABLE "PlayTemp";
