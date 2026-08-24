-- CreateTable
CREATE TABLE "CoLearningRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "description" TEXT,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "lastStreakDate" TIMESTAMP(3),
    "maxMembers" INTEGER NOT NULL DEFAULT 20,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoLearningRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomSyllabusItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomSyllabusItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomSyllabusCompletion" (
    "id" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "RoomSyllabusCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LINK',
    "roomId" TEXT NOT NULL,
    "addedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomDiscussion" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "itemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 25,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomStreak" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "membersActive" INTEGER NOT NULL DEFAULT 0,
    "targetMet" BOOLEAN NOT NULL DEFAULT false,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "RoomStreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoLearningRoom_inviteCode_key" ON "CoLearningRoom"("inviteCode");

-- CreateIndex
CREATE INDEX "CoLearningRoom_creatorId_idx" ON "CoLearningRoom"("creatorId");

-- CreateIndex
CREATE INDEX "CoLearningRoom_inviteCode_idx" ON "CoLearningRoom"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_userId_roomId_key" ON "RoomMember"("userId", "roomId");

-- CreateIndex
CREATE INDEX "RoomMember_roomId_idx" ON "RoomMember"("roomId");

-- CreateIndex
CREATE INDEX "RoomSyllabusItem_roomId_idx" ON "RoomSyllabusItem"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomSyllabusCompletion_userId_itemId_key" ON "RoomSyllabusCompletion"("userId", "itemId");

-- CreateIndex
CREATE INDEX "RoomSyllabusCompletion_itemId_idx" ON "RoomSyllabusCompletion"("itemId");

-- CreateIndex
CREATE INDEX "RoomResource_roomId_idx" ON "RoomResource"("roomId");

-- CreateIndex
CREATE INDEX "RoomDiscussion_roomId_idx" ON "RoomDiscussion"("roomId");

-- CreateIndex
CREATE INDEX "RoomDiscussion_itemId_idx" ON "RoomDiscussion"("itemId");

-- CreateIndex
CREATE INDEX "FocusSession_roomId_idx" ON "FocusSession"("roomId");

-- CreateIndex
CREATE INDEX "FocusSession_userId_idx" ON "FocusSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomStreak_roomId_date_key" ON "RoomStreak"("roomId", "date");

-- CreateIndex
CREATE INDEX "RoomStreak_roomId_idx" ON "RoomStreak"("roomId");

-- AddForeignKey
ALTER TABLE "CoLearningRoom" ADD CONSTRAINT "CoLearningRoom_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoLearningRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSyllabusItem" ADD CONSTRAINT "RoomSyllabusItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoLearningRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSyllabusCompletion" ADD CONSTRAINT "RoomSyllabusCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomSyllabusCompletion" ADD CONSTRAINT "RoomSyllabusCompletion_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RoomSyllabusItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomResource" ADD CONSTRAINT "RoomResource_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoLearningRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomResource" ADD CONSTRAINT "RoomResource_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomDiscussion" ADD CONSTRAINT "RoomDiscussion_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoLearningRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomDiscussion" ADD CONSTRAINT "RoomDiscussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomDiscussion" ADD CONSTRAINT "RoomDiscussion_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "RoomSyllabusItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoLearningRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomStreak" ADD CONSTRAINT "RoomStreak_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoLearningRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
