CREATE TABLE "UserGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserGroup_userId_groupId_key" ON "UserGroup"("userId", "groupId");
CREATE INDEX "UserGroup_userId_idx" ON "UserGroup"("userId");
CREATE INDEX "UserGroup_groupId_idx" ON "UserGroup"("groupId");

ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
