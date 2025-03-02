-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSeller" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "sellerApproved" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "shopName" TEXT,
    ADD COLUMN "shopDescription" TEXT,
    ADD COLUMN "sellerRating" DOUBLE PRECISION,
    ADD COLUMN "sellerRatingsCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "sellerSince" TIMESTAMP(3),
    ADD COLUMN "sellerBio" TEXT,
    ADD COLUMN "sellerLogo" TEXT,
    ADD COLUMN "sellerBanner" TEXT,
    ADD COLUMN "sellerSocial" JSONB;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,
    "sellerId" TEXT,
    "reviewerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
