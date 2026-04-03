-- =========================
-- 1. COMPANY
-- =========================

CREATE TABLE "Company" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- =========================
-- 2. ADD companyId nullable
-- =========================

ALTER TABLE "User" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Branch" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Kiosk" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Feedback" ADD COLUMN "companyId" TEXT;
ALTER TABLE "Tag" ADD COLUMN "companyId" TEXT;

-- =========================
-- 3. Create default company
-- =========================

INSERT INTO "Company" ("id", "name", "active", "createdAt", "updatedAt")
VALUES (
  'default_company',
  'Empresa Padrão',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- =========================
-- 4. Backfill old data
-- =========================

UPDATE "User"
SET "companyId" = 'default_company'
WHERE "companyId" IS NULL;

UPDATE "Branch"
SET "companyId" = 'default_company'
WHERE "companyId" IS NULL;

UPDATE "Kiosk"
SET "companyId" = 'default_company'
WHERE "companyId" IS NULL;

UPDATE "Feedback"
SET "companyId" = 'default_company'
WHERE "companyId" IS NULL;

UPDATE "Tag"
SET "companyId" = 'default_company'
WHERE "companyId" IS NULL;

-- =========================
-- 5. Make companyId required
-- =========================

ALTER TABLE "User" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Branch" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Kiosk" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Feedback" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Tag" ALTER COLUMN "companyId" SET NOT NULL;

-- =========================
-- 6. Foreign keys
-- =========================

ALTER TABLE "User"
ADD CONSTRAINT "User_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Branch"
ADD CONSTRAINT "Branch_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Kiosk"
ADD CONSTRAINT "Kiosk_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Feedback"
ADD CONSTRAINT "Feedback_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Tag"
ADD CONSTRAINT "Tag_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- =========================
-- 7. Useful indexes
-- =========================

CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE INDEX "Branch_companyId_idx" ON "Branch"("companyId");
CREATE INDEX "Kiosk_companyId_idx" ON "Kiosk"("companyId");
CREATE INDEX "Feedback_companyId_idx" ON "Feedback"("companyId");
CREATE INDEX "Tag_companyId_idx" ON "Tag"("companyId");