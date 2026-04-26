/*
  Warnings:

  - A unique constraint covering the columns `[publicToken]` on the table `SharedFeedbackAccess` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SharedFeedbackAccess" ADD COLUMN     "publicToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SharedFeedbackAccess_publicToken_key" ON "SharedFeedbackAccess"("publicToken");
