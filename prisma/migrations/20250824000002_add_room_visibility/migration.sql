-- AlterTable
ALTER TABLE "CoLearningRoom" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "CoLearningRoom" ADD COLUMN "passwordHash" TEXT;
