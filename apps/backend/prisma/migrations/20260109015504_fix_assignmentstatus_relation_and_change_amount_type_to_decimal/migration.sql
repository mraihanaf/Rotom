/*
  Warnings:

  - You are about to drop the `Gallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GalleryReaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to alter the column `totalAmount` on the `Fund` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `amount` on the `FundContributionLog` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - A unique constraint covering the columns `[name]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Gallery";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GalleryReaction";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "GalleryPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GalleryPostReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryPostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GalleryPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GalleryPostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AssignmentStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssignmentStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssignmentStatus_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssignmentStatus" ("assignmentId", "createdAt", "done", "id", "userId") SELECT "assignmentId", "createdAt", "done", "id", "userId" FROM "AssignmentStatus";
DROP TABLE "AssignmentStatus";
ALTER TABLE "new_AssignmentStatus" RENAME TO "AssignmentStatus";
CREATE UNIQUE INDEX "AssignmentStatus_assignmentId_userId_key" ON "AssignmentStatus"("assignmentId", "userId");
CREATE TABLE "new_Fund" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'idr'
);
INSERT INTO "new_Fund" ("currency", "id", "totalAmount") SELECT "currency", "id", "totalAmount" FROM "Fund";
DROP TABLE "Fund";
ALTER TABLE "new_Fund" RENAME TO "Fund";
CREATE TABLE "new_FundContributionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "fundId" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'idr',
    "amount" DECIMAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FundContributionLog_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundContributionLog_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundContributionLog_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FundContributionLog" ("amount", "contributorId", "createdAt", "currency", "fundId", "id", "note", "reporterId") SELECT "amount", "contributorId", "createdAt", "currency", "fundId", "id", "note", "reporterId" FROM "FundContributionLog";
DROP TABLE "FundContributionLog";
ALTER TABLE "new_FundContributionLog" RENAME TO "FundContributionLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GalleryPost_mediaKey_key" ON "GalleryPost"("mediaKey");

-- CreateIndex
CREATE INDEX "GalleryPost_createdAt_idx" ON "GalleryPost"("createdAt");

-- CreateIndex
CREATE INDEX "GalleryPostReaction_postId_emoji_idx" ON "GalleryPostReaction"("postId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryPostReaction_postId_userId_emoji_key" ON "GalleryPostReaction"("postId", "userId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");
