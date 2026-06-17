PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sku" TEXT NOT NULL,
  "sourceCode" TEXT,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "titleEn" TEXT,
  "titleAr" TEXT,
  "shortDescriptionEn" TEXT,
  "shortDescriptionAr" TEXT,
  "detailEn" TEXT,
  "detailAr" TEXT,
  "material" TEXT,
  "priceAed" REAL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "tags" TEXT,
  "collectionName" TEXT,
  "purchasePrice" REAL NOT NULL,
  "shippingFee" REAL NOT NULL,
  "packagingFee" REAL NOT NULL,
  "cost" REAL NOT NULL,
  "rawSuggestedPrice" REAL NOT NULL,
  "price" INTEGER NOT NULL,
  "priceReviewStatus" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku");

CREATE TABLE IF NOT EXISTS "ProductImage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "alt" TEXT,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductImage_productId_idx" ON "ProductImage"("productId");

CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderNumber" TEXT NOT NULL,
  "customerName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "fulfillmentStatus" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  "paymentMethod" TEXT,
  "shippingCarrier" TEXT,
  "trackingNumber" TEXT,
  "internalNote" TEXT,
  "shippingName" TEXT,
  "shippingPhone" TEXT,
  "shippingEmail" TEXT,
  "shippingAddress" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'AED',
  "total" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");

CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");
