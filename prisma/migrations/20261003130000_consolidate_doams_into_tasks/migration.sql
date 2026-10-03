DELETE FROM "Notification"
WHERE "type" IN ('INTEREST', 'MATCHED', 'STATUS_CHANGE', 'RATING');

DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "Comment" CASCADE;
DROP TABLE IF EXISTS "Like" CASCADE;
DROP TABLE IF EXISTS "SavedDoAm" CASCADE;
DROP TABLE IF EXISTS "Rating" CASCADE;
DROP TABLE IF EXISTS "DoAmStatusHistory" CASCADE;
DROP TABLE IF EXISTS "DoAmApplication" CASCADE;
DROP TABLE IF EXISTS "DoAm" CASCADE;

ALTER TABLE "Location" DROP COLUMN IF EXISTS "doamId";
DROP TYPE IF EXISTS "DoAmStatus";
DROP TYPE IF EXISTS "ApplicationStatus";

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "posterId" TEXT NOT NULL,
  "runnerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Conversation_taskId_key" ON "Conversation"("taskId");
CREATE INDEX "Conversation_posterId_createdAt_idx" ON "Conversation"("posterId", "createdAt");
CREATE INDEX "Conversation_runnerId_createdAt_idx" ON "Conversation"("runnerId", "createdAt");
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "Conversation" ("id", "taskId", "posterId", "runnerId", "createdAt")
SELECT 'task-chat-' || "id", "id", "posterId", "runnerId", COALESCE("claimedAt", "createdAt")
FROM "Task"
WHERE "runnerId" IS NOT NULL;

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TaskRating" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "raterId" TEXT NOT NULL,
  "ratedUserId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "review" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskRating_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaskRating_taskId_raterId_ratedUserId_key" ON "TaskRating"("taskId", "raterId", "ratedUserId");
CREATE INDEX "TaskRating_ratedUserId_idx" ON "TaskRating"("ratedUserId");
ALTER TABLE "TaskRating" ADD CONSTRAINT "TaskRating_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Profile" profile SET
  "ratingAverage" = 0,
  "ratingCount" = 0,
  "createdCount" = (
    SELECT COUNT(*) FROM "Task" WHERE "posterId" = profile."id"
  ),
  "completedCount" = (
    SELECT COUNT(*) FROM "Task"
    WHERE "status" = 'COMPLETED' AND ("posterId" = profile."id" OR "runnerId" = profile."id")
  );
