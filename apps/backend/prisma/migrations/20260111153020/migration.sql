/*
  Warnings:

  - A unique constraint covering the columns `[postId,userId]` on the table `GalleryPostReaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "GalleryPostReaction_postId_userId_emoji_key";

-- DropIndex
DROP INDEX "GalleryPostReaction_postId_emoji_idx";

-- CreateIndex
CREATE INDEX "GalleryPostReaction_postId_idx" ON "GalleryPostReaction"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryPostReaction_postId_userId_key" ON "GalleryPostReaction"("postId", "userId");
