-- Add profile picture storage (client sends a resized base64 data URI)
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
