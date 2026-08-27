-- CreateTable
CREATE TABLE "RoomProblem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'EASY',
    "languages" TEXT NOT NULL DEFAULT '["javascript","python"]',
    "starterCode" TEXT NOT NULL DEFAULT '{}',
    "testCases" TEXT NOT NULL,

    CONSTRAINT "RoomProblem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomProblemSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "problemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "results" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "RoomProblemSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoomProblem" ADD CONSTRAINT "RoomProblem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CoLearningRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomProblem" ADD CONSTRAINT "RoomProblem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomProblemSubmission" ADD CONSTRAINT "RoomProblemSubmission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "RoomProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomProblemSubmission" ADD CONSTRAINT "RoomProblemSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "RoomProblem_roomId_idx" ON "RoomProblem"("roomId");

-- CreateIndex
CREATE INDEX "RoomProblem_createdById_idx" ON "RoomProblem"("createdById");

-- CreateIndex
CREATE INDEX "RoomProblemSubmission_problemId_idx" ON "RoomProblemSubmission"("problemId");

-- CreateIndex
CREATE INDEX "RoomProblemSubmission_userId_idx" ON "RoomProblemSubmission"("userId");

-- CreateIndex
CREATE INDEX "RoomProblemSubmission_problemId_userId_idx" ON "RoomProblemSubmission"("problemId","userId");
