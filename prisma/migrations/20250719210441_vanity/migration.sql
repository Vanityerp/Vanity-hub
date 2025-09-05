-- AlterTable
ALTER TABLE "locations" ADD COLUMN "coordinates" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "discountAmount" DECIMAL;
ALTER TABLE "transactions" ADD COLUMN "discountPercentage" DECIMAL;
ALTER TABLE "transactions" ADD COLUMN "items" TEXT;
ALTER TABLE "transactions" ADD COLUMN "originalServiceAmount" DECIMAL;
ALTER TABLE "transactions" ADD COLUMN "productAmount" DECIMAL;
ALTER TABLE "transactions" ADD COLUMN "serviceAmount" DECIMAL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLogin" DATETIME;

-- CreateIndex
CREATE INDEX "appointments_date_idx" ON "appointments"("date");

-- CreateIndex
CREATE INDEX "appointments_clientId_idx" ON "appointments"("clientId");

-- CreateIndex
CREATE INDEX "appointments_staffId_idx" ON "appointments"("staffId");

-- CreateIndex
CREATE INDEX "appointments_locationId_idx" ON "appointments"("locationId");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "locations_name_idx" ON "locations"("name");

-- CreateIndex
CREATE INDEX "locations_city_country_idx" ON "locations"("city", "country");

-- CreateIndex
CREATE INDEX "locations_isActive_idx" ON "locations"("isActive");

-- CreateIndex
CREATE INDEX "services_name_idx" ON "services"("name");

-- CreateIndex
CREATE INDEX "services_category_isActive_idx" ON "services"("category", "isActive");

-- CreateIndex
CREATE INDEX "services_price_idx" ON "services"("price");

-- CreateIndex
CREATE INDEX "staff_members_name_idx" ON "staff_members"("name");

-- CreateIndex
CREATE INDEX "staff_members_status_idx" ON "staff_members"("status");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
