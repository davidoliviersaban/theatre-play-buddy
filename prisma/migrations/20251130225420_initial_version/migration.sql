-- CreateEnum
CREATE TYPE "LineType" AS ENUM ('dialogue', 'stage_direction');

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "year" INTEGER,
    "genre" TEXT,
    "description" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastSelected" BOOLEAN NOT NULL DEFAULT false,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "playbookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Act" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "playbookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Act_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "actId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Line" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "LineType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "indentLevel" INTEGER,
    "preserveLineBreaks" BOOLEAN,
    "rehearsalCount" INTEGER NOT NULL DEFAULT 0,
    "sceneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineCharacter" (
    "lineId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineCharacter_pkey" PRIMARY KEY ("lineId","characterId")
);

-- CreateIndex
CREATE INDEX "Playbook_title_idx" ON "Playbook"("title");

-- CreateIndex
CREATE INDEX "Playbook_author_idx" ON "Playbook"("author");

-- CreateIndex
CREATE INDEX "Character_playbookId_idx" ON "Character"("playbookId");

-- CreateIndex
CREATE INDEX "Character_name_idx" ON "Character"("name");

-- CreateIndex
CREATE INDEX "Act_playbookId_idx" ON "Act"("playbookId");

-- CreateIndex
CREATE INDEX "Act_playbookId_order_idx" ON "Act"("playbookId", "order");

-- CreateIndex
CREATE INDEX "Scene_actId_idx" ON "Scene"("actId");

-- CreateIndex
CREATE INDEX "Scene_actId_order_idx" ON "Scene"("actId", "order");

-- CreateIndex
CREATE INDEX "Line_sceneId_idx" ON "Line"("sceneId");

-- CreateIndex
CREATE INDEX "Line_sceneId_order_idx" ON "Line"("sceneId", "order");

-- CreateIndex
CREATE INDEX "Line_type_idx" ON "Line"("type");

-- CreateIndex
CREATE INDEX "LineCharacter_lineId_idx" ON "LineCharacter"("lineId");

-- CreateIndex
CREATE INDEX "LineCharacter_characterId_idx" ON "LineCharacter"("characterId");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Act" ADD CONSTRAINT "Act_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_actId_fkey" FOREIGN KEY ("actId") REFERENCES "Act"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineCharacter" ADD CONSTRAINT "LineCharacter_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineCharacter" ADD CONSTRAINT "LineCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
