-- CreateTable
CREATE TABLE "RoomQuizLock" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RoomQuizLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomQuizLock_quizId_userId_key" ON "RoomQuizLock"("quizId", "userId");

-- CreateIndex
CREATE INDEX "RoomQuizLock_quizId_idx" ON "RoomQuizLock"("quizId");

-- CreateIndex
CREATE INDEX "RoomQuizLock_userId_idx" ON "RoomQuizLock"("userId");

-- AddForeignKey
ALTER TABLE "RoomQuizLock" ADD CONSTRAINT "RoomQuizLock_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "RoomQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomQuizLock" ADD CONSTRAINT "RoomQuizLock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
