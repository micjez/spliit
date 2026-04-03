-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "currentQuantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "checkIntervalDays" INTEGER NOT NULL,
    "nextCheckAt" TIMESTAMP(3) NOT NULL,
    "lastCheckedAt" TIMESTAMP(3),
    "groupId" TEXT NOT NULL,
    "categoryId" INTEGER,
    "createdByUserId" TEXT NOT NULL,
    "lastCheckedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ShoppingItem"
ADD COLUMN "stockItemId" TEXT;

-- CreateIndex
CREATE INDEX "StockItem_groupId_nextCheckAt_createdAt_idx" ON "StockItem"("groupId", "nextCheckAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StockItem_groupId_categoryId_idx" ON "StockItem"("groupId", "categoryId");

-- CreateIndex
CREATE INDEX "StockItem_createdByUserId_idx" ON "StockItem"("createdByUserId");

-- CreateIndex
CREATE INDEX "StockItem_lastCheckedByUserId_idx" ON "StockItem"("lastCheckedByUserId");

-- CreateIndex
CREATE INDEX "ShoppingItem_stockItemId_isArchived_idx" ON "ShoppingItem"("stockItemId", "isArchived");

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_lastCheckedByUserId_fkey" FOREIGN KEY ("lastCheckedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
