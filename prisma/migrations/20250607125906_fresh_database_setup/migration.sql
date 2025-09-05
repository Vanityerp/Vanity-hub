/*
  Warnings:

  - You are about to alter the column `price` on the `appointment_products` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - You are about to alter the column `price` on the `product_locations` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- AlterTable
ALTER TABLE "staff_members" ADD COLUMN "dateOfBirth" DATETIME;
ALTER TABLE "staff_members" ADD COLUMN "employeeNumber" TEXT;
ALTER TABLE "staff_members" ADD COLUMN "jobRole" TEXT;
ALTER TABLE "staff_members" ADD COLUMN "medicalValidity" TEXT;
ALTER TABLE "staff_members" ADD COLUMN "passportNumber" TEXT;
ALTER TABLE "staff_members" ADD COLUMN "passportValidity" TEXT;
ALTER TABLE "staff_members" ADD COLUMN "profileImage" TEXT;
ALTER TABLE "staff_members" ADD COLUMN "profileImageType" TEXT;
ALTER TABLE "staff_members" ADD COLUMN "qidNumber" TEXT;
ALTER TABLE "staff_members" ADD COLUMN "qidValidity" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_appointment_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointment_products_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointment_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_appointment_products" ("appointmentId", "createdAt", "id", "price", "productId", "quantity") SELECT "appointmentId", "createdAt", "id", "price", "productId", "quantity" FROM "appointment_products";
DROP TABLE "appointment_products";
ALTER TABLE "new_appointment_products" RENAME TO "appointment_products";
CREATE TABLE "new_product_locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_locations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_product_locations" ("createdAt", "id", "isActive", "locationId", "price", "productId", "stock", "updatedAt") SELECT "createdAt", "id", "isActive", "locationId", "price", "productId", "stock", "updatedAt" FROM "product_locations";
DROP TABLE "product_locations";
ALTER TABLE "new_product_locations" RENAME TO "product_locations";
CREATE UNIQUE INDEX "product_locations_productId_locationId_key" ON "product_locations"("productId", "locationId");
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "cost" REAL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "brand" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "image" TEXT,
    "isRetail" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isSale" BOOLEAN NOT NULL DEFAULT false,
    "salePrice" REAL,
    "rating" REAL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT,
    "ingredients" TEXT,
    "howToUse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_products" ("brand", "category", "createdAt", "description", "id", "isActive", "name", "price", "sku", "updatedAt") SELECT "brand", "category", "createdAt", "description", "id", "isActive", "name", "price", "sku", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
