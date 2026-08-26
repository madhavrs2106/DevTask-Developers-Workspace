-- CreateTable
CREATE TABLE "RoomQuiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "RoomQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomQuizQuestion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MCQ',
    "options" TEXT,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "quizId" TEXT NOT NULL,

    CONSTRAINT "RoomQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomQuizSubmission" (
    "id" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RoomQuizSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomQuiz_roomId_idx" ON "RoomQuiz"("roomId");

-- CreateIndex
CREATE INDEX "RoomQuizQuestion_quizId_idx" ON "RoomQuizQuestion"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomQuizSubmission_quizId_userId_key" ON "RoomQuizSubmission"("quizId", "userId");

-- CreateIndex
CREATE INDEX "RoomQuizSubmission_quizId_idx" ON "RoomQuizSubmission"("quizId");

-- CreateIndex
CREATE INDEX "RoomQuizSubmission_userId_idx" ON "RoomQuizSubmission"("userId");

-- AddForeignKey
ALTER TABLE "RoomQuiz" ADD CONSTRAINT "RoomQuiz_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoLearningRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomQuiz" ADD CONSTRAINT "RoomQuiz_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomQuizQuestion" ADD CONSTRAINT "RoomQuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "RoomQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomQuizSubmission" ADD CONSTRAINT "RoomQuizSubmission_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "RoomQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomQuizSubmission" ADD CONSTRAINT "RoomQuizSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
