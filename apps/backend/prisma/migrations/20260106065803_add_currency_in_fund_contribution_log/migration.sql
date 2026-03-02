-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
INSERT INTO "new_FundContributionLog" ("amount", "contributorId", "createdAt", "fundId", "id", "note", "reporterId") SELECT "amount", "contributorId", "createdAt", "fundId", "id", "note", "reporterId" FROM "FundContributionLog";
DROP TABLE "FundContributionLog";
ALTER TABLE "new_FundContributionLog" RENAME TO "FundContributionLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
