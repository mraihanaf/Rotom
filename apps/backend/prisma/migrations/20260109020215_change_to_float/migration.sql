/*
  Warnings:

  - You are about to alter the column `totalAmount` on the `Fund` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - You are about to alter the column `amount` on the `FundContributionLog` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fund" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "totalAmount" REAL NOT NULL DEFAULT 0,
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
    "amount" REAL NOT NULL,
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
