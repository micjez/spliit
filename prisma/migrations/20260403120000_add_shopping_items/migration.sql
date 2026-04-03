-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "groupId" TEXT NOT NULL,
    "categoryId" INTEGER,
    "createdByUserId" TEXT NOT NULL,
    "boughtByUserId" TEXT,
    "boughtAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "isBought" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShoppingItem_groupId_isArchived_createdAt_idx" ON "ShoppingItem"("groupId", "isArchived", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ShoppingItem_groupId_categoryId_idx" ON "ShoppingItem"("groupId", "categoryId");

-- CreateIndex
CREATE INDEX "ShoppingItem_createdByUserId_idx" ON "ShoppingItem"("createdByUserId");

-- CreateIndex
CREATE INDEX "ShoppingItem_boughtByUserId_idx" ON "ShoppingItem"("boughtByUserId");

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_boughtByUserId_fkey" FOREIGN KEY ("boughtByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
