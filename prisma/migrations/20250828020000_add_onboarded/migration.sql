-- Track whether a user has completed the first-time details wizard
ALTER TABLE "User" ADD COLUMN "onboarded" BOOLEAN NOT NULL DEFAULT false;
