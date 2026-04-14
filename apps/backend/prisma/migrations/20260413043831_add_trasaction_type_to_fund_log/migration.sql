/*
  Warnings:

  - Added the required column `dayOfWeek` to the `SubjectSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `SubjectSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `SubjectSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `SubjectSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SubjectSchedule` table without a default value. This is not possible if the table is not empty.

*/
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
    "type" TEXT NOT NULL DEFAULT 'INCOME',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FundContributionLog_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundContributionLog_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundContributionLog_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FundContributionLog" ("amount", "contributorId", "createdAt", "currency", "fundId", "id", "note", "reporterId") SELECT "amount", "contributorId", "createdAt", "currency", "fundId", "id", "note", "reporterId" FROM "FundContributionLog";
DROP TABLE "FundContributionLog";
ALTER TABLE "new_FundContributionLog" RENAME TO "FundContributionLog";
CREATE INDEX "FundContributionLog_reporterId_idx" ON "FundContributionLog"("reporterId");
CREATE INDEX "FundContributionLog_contributorId_idx" ON "FundContributionLog"("contributorId");
CREATE INDEX "FundContributionLog_type_idx" ON "FundContributionLog"("type");
CREATE TABLE "new_SubjectSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subjectId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubjectSchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SubjectSchedule" ("id") SELECT "id" FROM "SubjectSchedule";
DROP TABLE "SubjectSchedule";
ALTER TABLE "new_SubjectSchedule" RENAME TO "SubjectSchedule";
CREATE INDEX "SubjectSchedule_subjectId_idx" ON "SubjectSchedule"("subjectId");
CREATE INDEX "SubjectSchedule_dayOfWeek_idx" ON "SubjectSchedule"("dayOfWeek");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
