/*
  Warnings:

  - The values [ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[companyId]` on the table `Setting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `Setting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'COMPANY_ADMIN';
COMMIT;

-- DropIndex
DROP INDEX "Branch_companyId_idx";

-- DropIndex
DROP INDEX "Feedback_companyId_idx";

-- DropIndex
DROP INDEX "Kiosk_companyId_idx";

-- DropIndex
DROP INDEX "Tag_companyId_idx";

-- DropIndex
DROP INDEX "User_companyId_idx";

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "backgroundImageUrl" TEXT,
ADD COLUMN     "buttonTextColor" TEXT,
ADD COLUMN     "cardBackgroundColor" TEXT,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "heroSubtitle" TEXT,
ADD COLUMN     "heroTitle" TEXT,
ADD COLUMN     "textColor" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "role" SET DEFAULT 'COMPANY_ADMIN';

-- CreateIndex
CREATE UNIQUE INDEX "Setting_companyId_key" ON "Setting"("companyId");

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
