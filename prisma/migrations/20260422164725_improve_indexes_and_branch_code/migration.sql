/*
  Warnings:

  - A unique constraint covering the columns `[companyId,code]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Branch_code_key";

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");

-- CreateIndex
CREATE INDEX "Branch_companyId_active_idx" ON "Branch"("companyId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_companyId_code_key" ON "Branch"("companyId", "code");

-- CreateIndex
CREATE INDEX "Company_active_idx" ON "Company"("active");

-- CreateIndex
CREATE INDEX "Feedback_companyId_idx" ON "Feedback"("companyId");

-- CreateIndex
CREATE INDEX "Feedback_branchId_idx" ON "Feedback"("branchId");

-- CreateIndex
CREATE INDEX "Feedback_kioskId_idx" ON "Feedback"("kioskId");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_companyId_createdAt_idx" ON "Feedback"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_branchId_createdAt_idx" ON "Feedback"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_kioskId_createdAt_idx" ON "Feedback"("kioskId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackTag_feedbackId_idx" ON "FeedbackTag"("feedbackId");

-- CreateIndex
CREATE INDEX "FeedbackTag_tagId_idx" ON "FeedbackTag"("tagId");

-- CreateIndex
CREATE INDEX "Kiosk_companyId_idx" ON "Kiosk"("companyId");

-- CreateIndex
CREATE INDEX "Kiosk_branchId_idx" ON "Kiosk"("branchId");

-- CreateIndex
CREATE INDEX "Kiosk_companyId_active_idx" ON "Kiosk"("companyId", "active");

-- CreateIndex
CREATE INDEX "Kiosk_branchId_active_idx" ON "Kiosk"("branchId", "active");

-- CreateIndex
CREATE INDEX "SharedFeedbackAccess_expiresAt_idx" ON "SharedFeedbackAccess"("expiresAt");

-- CreateIndex
CREATE INDEX "Tag_companyId_idx" ON "Tag"("companyId");

-- CreateIndex
CREATE INDEX "Tag_companyId_active_idx" ON "Tag"("companyId", "active");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_active_idx" ON "User"("active");
