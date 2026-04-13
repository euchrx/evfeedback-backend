/*
  Warnings:

  - You are about to drop the column `environmentType` on the `Kiosk` table. All the data in the column will be lost.
  - You are about to drop the column `environmentType` on the `Tag` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Kiosk" DROP COLUMN "environmentType";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "environmentType";

-- DropEnum
DROP TYPE "EnvironmentType";

-- CreateTable
CREATE TABLE "SharedFeedbackAccess" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT,
    "tokenHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedFeedbackAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedFeedbackAccess_tokenHash_key" ON "SharedFeedbackAccess"("tokenHash");

-- CreateIndex
CREATE INDEX "SharedFeedbackAccess_companyId_active_idx" ON "SharedFeedbackAccess"("companyId", "active");

-- AddForeignKey
ALTER TABLE "SharedFeedbackAccess" ADD CONSTRAINT "SharedFeedbackAccess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
