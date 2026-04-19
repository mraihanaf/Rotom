-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "ENABLE_WHATSAPP_BOT_FUND_REPORT" BOOLEAN NOT NULL DEFAULT true,
    "ENABLE_WHATSAPP_BOT_DUTY_REPORT" BOOLEAN NOT NULL DEFAULT true,
    "ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER" BOOLEAN NOT NULL DEFAULT true,
    "ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER" BOOLEAN NOT NULL DEFAULT true,
    "ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER" BOOLEAN NOT NULL DEFAULT true,
    "announcementGroupJid" TEXT,
    "dutyReminderTime" TEXT NOT NULL DEFAULT '07:00',
    "scheduleReminderTime" TEXT NOT NULL DEFAULT '07:00',
    "assignmentReminderTime" TEXT NOT NULL DEFAULT '18:00',
    "birthdayReminderTime" TEXT NOT NULL DEFAULT '09:00',
    "fundReportDay" INTEGER NOT NULL DEFAULT 1,
    "fundReportTime" TEXT NOT NULL DEFAULT '08:00',
    "dutyPersonalizedMessage" TEXT NOT NULL DEFAULT 'jangan lupa piket hari ini ya {name}!',
    "birthdayMessageTemplate" TEXT NOT NULL DEFAULT 'Selamat ulang tahun {name}! Semoga panjang umur dan sehat selalu!',
    "timezone" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER", "ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER", "ENABLE_WHATSAPP_BOT_DUTY_REPORT", "ENABLE_WHATSAPP_BOT_FUND_REPORT", "ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER", "announcementGroupJid", "assignmentReminderTime", "birthdayMessageTemplate", "birthdayReminderTime", "createdAt", "dutyPersonalizedMessage", "dutyReminderTime", "fundReportDay", "fundReportTime", "id", "scheduleReminderTime", "updatedAt") SELECT "ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER", "ENABLE_WHATSAPP_BOT_BIRTHDAY_REMINDER", "ENABLE_WHATSAPP_BOT_DUTY_REPORT", "ENABLE_WHATSAPP_BOT_FUND_REPORT", "ENABLE_WHATSAPP_BOT_SUBJECT_SCHEDULE_REMINDER", "announcementGroupJid", "assignmentReminderTime", "birthdayMessageTemplate", "birthdayReminderTime", "createdAt", "dutyPersonalizedMessage", "dutyReminderTime", "fundReportDay", "fundReportTime", "id", "scheduleReminderTime", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
