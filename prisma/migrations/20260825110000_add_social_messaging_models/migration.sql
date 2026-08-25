-- Server-owned social and messaging data replacing the former browser database calls.
CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comment" (
  "id" TEXT NOT NULL,
  "doamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Like" (
  "id" TEXT NOT NULL,
  "doamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedDoAm" (
  "id" TEXT NOT NULL,
  "doamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "SavedDoAm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rating" (
  "id" TEXT NOT NULL,
  "doamId" TEXT NOT NULL,
  "raterId" TEXT NOT NULL,
  "ratedUserId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "review" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Comment_doamId_createdAt_idx" ON "Comment"("doamId", "createdAt");
CREATE UNIQUE INDEX "Like_doamId_userId_key" ON "Like"("doamId", "userId");
CREATE UNIQUE INDEX "SavedDoAm_doamId_userId_key" ON "SavedDoAm"("doamId", "userId");
CREATE UNIQUE INDEX "Rating_doamId_raterId_key" ON "Rating"("doamId", "raterId");

ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_doamId_fkey" FOREIGN KEY ("doamId") REFERENCES "DoAm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_doamId_fkey" FOREIGN KEY ("doamId") REFERENCES "DoAm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedDoAm" ADD CONSTRAINT "SavedDoAm_doamId_fkey" FOREIGN KEY ("doamId") REFERENCES "DoAm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_doamId_fkey" FOREIGN KEY ("doamId") REFERENCES "DoAm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
