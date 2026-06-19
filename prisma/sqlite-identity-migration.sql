ALTER TABLE "Product" ADD COLUMN "legacyCode" TEXT;
ALTER TABLE "Product" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Product" ADD COLUMN "gemstoneType" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Product" ADD COLUMN "certificateAuthority" TEXT;
ALTER TABLE "Product" ADD COLUMN "certificateNumber" TEXT;
ALTER TABLE "Product" ADD COLUMN "certificateUrl" TEXT;
CREATE UNIQUE INDEX "Product_legacyCode_key" ON "Product"("legacyCode");

UPDATE "Product"
SET "legacyCode" = "sourceCode"
WHERE "sourceCode" GLOB 'BB[0-9]*';

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
