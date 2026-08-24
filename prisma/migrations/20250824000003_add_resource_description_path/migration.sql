-- AlterTable RoomResource: add description and path fields
ALTER TABLE "RoomResource" ADD COLUMN "description" TEXT;
ALTER TABLE "RoomResource" ADD COLUMN "path" TEXT NOT NULL DEFAULT '';

