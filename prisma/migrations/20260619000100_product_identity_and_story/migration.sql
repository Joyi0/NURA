-- Extend product classification.
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'SET';

CREATE TYPE "ProductColor" AS ENUM ('YELLOW', 'RED', 'PINK', 'BLUE', 'GREEN', 'COLORLESS', 'UNKNOWN');
CREATE TYPE "GemstoneType" AS ENUM ('LAB_GROWN_DIAMOND', 'MOISSANITE', 'LAB_GROWN_COLORED_GEMSTONE', 'OTHER', 'UNKNOWN');

ALTER TABLE "Product"
ADD COLUMN "legacyCode" TEXT,
ADD COLUMN "color" "ProductColor" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "gemstoneType" "GemstoneType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "certificateAuthority" TEXT,
ADD COLUMN "certificateNumber" TEXT,
ADD COLUMN "certificateUrl" TEXT;

CREATE UNIQUE INDEX "Product_legacyCode_key" ON "Product"("legacyCode");

-- Keep every existing BB code for image lookup and operational traceability.
UPDATE "Product"
SET "legacyCode" = "sourceCode"
WHERE "sourceCode" ~ '^BB[0-9]+$';

-- Assign only products whose color and style have been explicitly confirmed.
UPDATE "Product" SET "sku"='BE01', "sourceCode"='BE01', "color"='BLUE', "gemstoneType"='LAB_GROWN_COLORED_GEMSTONE' WHERE "legacyCode"='BB01';
UPDATE "Product" SET "sku"='GE01', "sourceCode"='GE01', "color"='GREEN', "gemstoneType"='LAB_GROWN_COLORED_GEMSTONE' WHERE "legacyCode"='BB02';
UPDATE "Product" SET "sku"='PN01', "sourceCode"='PN01', "color"='PINK', "gemstoneType"='LAB_GROWN_COLORED_GEMSTONE' WHERE "legacyCode"='BB22';
UPDATE "Product" SET "sku"='PN02', "sourceCode"='PN02', "color"='PINK', "gemstoneType"='LAB_GROWN_COLORED_GEMSTONE' WHERE "legacyCode"='BB24';
UPDATE "Product" SET "sku"='BN01', "sourceCode"='BN01', "color"='BLUE', "gemstoneType"='LAB_GROWN_COLORED_GEMSTONE' WHERE "legacyCode"='BB30';
UPDATE "Product" SET "sku"='BE02', "sourceCode"='BE02', "color"='BLUE', "gemstoneType"='LAB_GROWN_COLORED_GEMSTONE' WHERE "legacyCode"='BB54';
UPDATE "Product" SET "sku"='DB01', "sourceCode"='DB01', "color"='COLORLESS', "gemstoneType"='UNKNOWN' WHERE "legacyCode"='BB65';
UPDATE "Product" SET "sku"='BR01', "sourceCode"='BR01', "color"='BLUE', "gemstoneType"='LAB_GROWN_COLORED_GEMSTONE' WHERE "legacyCode"='BB66';
UPDATE "Product" SET "sku"='RB01', "sourceCode"='RB01', "color"='RED', "gemstoneType"='LAB_GROWN_COLORED_GEMSTONE' WHERE "legacyCode"='BB69';
UPDATE "Product" SET "sku"='DR01', "sourceCode"='DR01', "color"='COLORLESS', "gemstoneType"='UNKNOWN' WHERE "legacyCode"='BB84';
