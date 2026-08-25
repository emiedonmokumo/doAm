-- PostgreSQL requires the enum value to be committed before it can be used
-- as a column default, so this follows the enum migration above.
ALTER TABLE "DoAmApplication" ALTER COLUMN "status" SET DEFAULT 'INTERESTED';
