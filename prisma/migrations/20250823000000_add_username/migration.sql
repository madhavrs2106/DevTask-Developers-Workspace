-- AddUsername: adds the username column and backfills existing users.

-- 1. Add column with a temporary default so existing rows get a value.
ALTER TABLE "User" ADD COLUMN "username" TEXT NOT NULL DEFAULT '';

-- 2. Backfill existing users with a unique username derived from their name.
--    Strips non-alphanumeric chars, lowercases, and prefixes with "user_".
UPDATE "User"
SET "username" = 'user_' || LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]', '', 'g'))
WHERE "username" = '';

-- 3. If any collisions resulted from the simple name derivation, append a suffix.
--    (Handles cases where two users have the same name.)
WITH dupes AS (
  SELECT "id", "username",
         ROW_NUMBER() OVER (PARTITION BY "username" ORDER BY "createdAt") AS rn
  FROM "User"
  WHERE "username" LIKE 'user_%'
)
UPDATE "User" u
SET "username" = u."username" || '_' || d.rn
FROM dupes d
WHERE u."id" = d."id" AND d.rn > 1;

-- 4. Unique index (created after backfill so no duplicates block it).
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
