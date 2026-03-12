-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "loginName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Venue_loginName_key" ON "Venue"("loginName");
