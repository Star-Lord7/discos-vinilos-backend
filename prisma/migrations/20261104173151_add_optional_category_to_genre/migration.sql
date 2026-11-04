-- AlterTable
ALTER TABLE "genres" ADD COLUMN     "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "genres_categoryId_idx" ON "genres"("categoryId");

-- AddForeignKey
ALTER TABLE "genres" ADD CONSTRAINT "genres_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
