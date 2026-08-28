-- Add resume / academic profile fields to User (stored as JSON text)
ALTER TABLE "User" ADD COLUMN "academicDetails" TEXT;
ALTER TABLE "User" ADD COLUMN "contactDetails" TEXT;
ALTER TABLE "User" ADD COLUMN "resumeExtras" TEXT;
