-- CreateEnum
CREATE TYPE "ChoreRecurrenceRule" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "Chore" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueAt" DATE NOT NULL,
    "recurrenceRule" "ChoreRecurrenceRule" NOT NULL DEFAULT 'NONE',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastCompletedAt" TIMESTAMP(3),
    "groupId" TEXT NOT NULL,
    "categoryId" INTEGER,
    "assigneeParticipantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chore_groupId_isCompleted_dueAt_createdAt_idx" ON "Chore"("groupId", "isCompleted", "dueAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Chore_groupId_categoryId_idx" ON "Chore"("groupId", "categoryId");

-- CreateIndex
CREATE INDEX "Chore_assigneeParticipantId_idx" ON "Chore"("assigneeParticipantId");

-- AddForeignKey
ALTER TABLE "Chore" ADD CONSTRAINT "Chore_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chore" ADD CONSTRAINT "Chore_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chore" ADD CONSTRAINT "Chore_assigneeParticipantId_fkey" FOREIGN KEY ("assigneeParticipantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
