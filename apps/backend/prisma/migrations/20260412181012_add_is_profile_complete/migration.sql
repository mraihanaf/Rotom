-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "phoneNumber" TEXT,
    "phoneNumberVerified" BOOLEAN,
    "role" TEXT,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" DATETIME,
    "birthday" DATETIME
);
INSERT INTO "new_user" ("banExpires", "banReason", "banned", "birthday", "createdAt", "email", "emailVerified", "id", "image", "name", "phoneNumber", "phoneNumberVerified", "role", "updatedAt") SELECT "banExpires", "banReason", "banned", "birthday", "createdAt", "email", "emailVerified", "id", "image", "name", "phoneNumber", "phoneNumberVerified", "role", "updatedAt" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_phoneNumber_key" ON "user"("phoneNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
