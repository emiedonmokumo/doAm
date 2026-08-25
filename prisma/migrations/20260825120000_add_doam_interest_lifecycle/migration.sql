-- Existing ACCEPTED applications remain selected helpers. INTERESTED is the
-- requester-selection state introduced by the opportunity lifecycle.
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'INTERESTED';
DROP INDEX IF EXISTS "Rating_doamId_raterId_key";
CREATE UNIQUE INDEX "Rating_doamId_raterId_ratedUserId_key" ON "Rating"("doamId", "raterId", "ratedUserId");
