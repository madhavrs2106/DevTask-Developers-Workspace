-- AlterTable
ALTER TABLE "RoomDiscussion" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "RoomDiscussion_parentId_idx" ON "RoomDiscussion"("parentId");

-- AddForeignKey
ALTER TABLE "RoomDiscussion" ADD CONSTRAINT "RoomDiscussion_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "RoomDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
