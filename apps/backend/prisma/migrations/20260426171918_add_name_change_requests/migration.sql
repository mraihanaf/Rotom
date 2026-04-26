-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserNameChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestedName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "adminsNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" DATETIME,
    CONSTRAINT "UserNameChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserNameChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserNameChangeRequest" ("id", "rejectionReason", "requestedAt", "requestedName", "reviewedAt", "reviewedById", "source", "status", "userId") SELECT "id", "rejectionReason", "requestedAt", "requestedName", "reviewedAt", "reviewedById", "source", "status", "userId" FROM "UserNameChangeRequest";
DROP TABLE "UserNameChangeRequest";
ALTER TABLE "new_UserNameChangeRequest" RENAME TO "UserNameChangeRequest";
CREATE INDEX "UserNameChangeRequest_userId_status_idx" ON "UserNameChangeRequest"("userId", "status");
CREATE INDEX "UserNameChangeRequest_status_requestedAt_idx" ON "UserNameChangeRequest"("status", "requestedAt");
CREATE INDEX "UserNameChangeRequest_requestedAt_idx" ON "UserNameChangeRequest"("requestedAt");
CREATE INDEX "UserNameChangeRequest_adminsNotified_status_idx" ON "UserNameChangeRequest"("adminsNotified", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
