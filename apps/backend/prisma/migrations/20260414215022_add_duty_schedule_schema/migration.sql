/*
  Warnings:

  - You are about to drop the `Duty` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dayOfWeek` to the `DutySchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dutyTypeId` to the `DutySchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DutySchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `DutySchedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Duty";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "DutyType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DutySchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dutyTypeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DutySchedule_dutyTypeId_fkey" FOREIGN KEY ("dutyTypeId") REFERENCES "DutyType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DutySchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DutySchedule" ("id") SELECT "id" FROM "DutySchedule";
DROP TABLE "DutySchedule";
ALTER TABLE "new_DutySchedule" RENAME TO "DutySchedule";
CREATE UNIQUE INDEX "DutySchedule_dutyTypeId_userId_dayOfWeek_key" ON "DutySchedule"("dutyTypeId", "userId", "dayOfWeek");
CREATE TABLE "new_FundContributionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "contributorId" TEXT,
    "fundId" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'idr',
    "amount" REAL NOT NULL,
    "note" TEXT,
    "type" TEXT NOT NULL DEFAULT 'INCOME',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FundContributionLog_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundContributionLog_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundContributionLog_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FundContributionLog" ("amount", "contributorId", "createdAt", "currency", "fundId", "id", "note", "reporterId", "type") SELECT "amount", "contributorId", "createdAt", "currency", "fundId", "id", "note", "reporterId", "type" FROM "FundContributionLog";
DROP TABLE "FundContributionLog";
ALTER TABLE "new_FundContributionLog" RENAME TO "FundContributionLog";
CREATE INDEX "FundContributionLog_reporterId_idx" ON "FundContributionLog"("reporterId");
CREATE INDEX "FundContributionLog_contributorId_idx" ON "FundContributionLog"("contributorId");
CREATE INDEX "FundContributionLog_type_idx" ON "FundContributionLog"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
