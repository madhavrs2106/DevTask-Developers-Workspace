-- CreateTable RoomNote
CREATE TABLE "RoomNote" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FOLDER',
    "fileType" TEXT,
    "content" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roomId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "RoomNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomNote_roomId_idx" ON "RoomNote"("roomId");
CREATE INDEX "RoomNote_parentId_idx" ON "RoomNote"("parentId");

-- AddForeignKey
ALTER TABLE "RoomNote" ADD CONSTRAINT "RoomNote_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoLearningRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomNote" ADD CONSTRAINT "RoomNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomNote" ADD CONSTRAINT "RoomNote_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "RoomNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

