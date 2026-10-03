CREATE TYPE "TaskCategory" AS ENUM ('PICKUP_DELIVERY', 'QUEUEING', 'FAVOR', 'QUICK_REPAIR');
CREATE TYPE "SettlementMethod" AS ENUM ('CASH_ON_DELIVERY', 'DIRECT_TRANSFER');
CREATE TYPE "TaskStatus" AS ENUM ('POSTED', 'CLAIMED', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP', 'PROOF_SUBMITTED', 'EN_ROUTE_DROPOFF', 'ARRIVED_DROPOFF', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Task" (
  "id" TEXT NOT NULL, "posterId" TEXT NOT NULL, "runnerId" TEXT,
  "title" TEXT NOT NULL, "description" TEXT, "category" "TaskCategory" NOT NULL,
  "runnerFee" DECIMAL(12,2) NOT NULL, "estimatedExpenses" DECIMAL(12,2) NOT NULL,
  "settlementMethod" "SettlementMethod" NOT NULL, "status" "TaskStatus" NOT NULL DEFAULT 'POSTED',
  "pickupLatitude" DECIMAL(10,7) NOT NULL, "pickupLongitude" DECIMAL(10,7) NOT NULL,
  "pickupCity" TEXT NOT NULL, "pickupRegion" TEXT NOT NULL, "pickupApproximateArea" TEXT NOT NULL,
  "dropoffLatitude" DECIMAL(10,7), "dropoffLongitude" DECIMAL(10,7), "dropoffCity" TEXT,
  "dropoffRegion" TEXT, "dropoffApproximateArea" TEXT,
  "handshakePinHash" TEXT NOT NULL, "pinFailedAttempts" INTEGER NOT NULL DEFAULT 0, "pinLockedAt" TIMESTAMP(3),
  "proofUrl" TEXT, "proofPublicId" TEXT, "claimedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TaskEvent" (
  "id" TEXT NOT NULL, "taskId" TEXT NOT NULL, "actorId" TEXT NOT NULL, "type" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Task_status_createdAt_idx" ON "Task"("status", "createdAt");
CREATE INDEX "Task_posterId_createdAt_idx" ON "Task"("posterId", "createdAt");
CREATE INDEX "Task_runnerId_status_idx" ON "Task"("runnerId", "status");
CREATE INDEX "TaskEvent_taskId_createdAt_idx" ON "TaskEvent"("taskId", "createdAt");
ALTER TABLE "Task" ADD CONSTRAINT "Task_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_runnerId_fkey" FOREIGN KEY ("runnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskEvent" ADD CONSTRAINT "TaskEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
