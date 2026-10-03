-- Delete orphaned locations without a profile, if any
DELETE FROM "Location" WHERE "profileId" IS NULL;

-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "profileId" SET NOT NULL;
ALTER TABLE "Location" DROP COLUMN IF EXISTS "country";
