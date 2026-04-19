# WhatsApp Bot Features - Implementation Summary

## Features Implemented

### 1. WhatsApp Commands
- `/announcement add <group_jid>` - Set announcement group (admin only)
- `/fund` - Show current fund balance and monthly report
- `/schedule` - Show today's subject schedule
- `/assignments` - Show pending assignments

### 2. Automated Daily Announcements
- **Duty Reminder** - Sends to group + personalized private message to each scheduled person
- **Schedule Reminder** - Daily subject schedule announcement
- **Assignment Reminder** - Pending assignments notification
- **Birthday Check** - Birthday celebration messages (group + private)

### 3. Monthly Fund Report
- Automated on configured day of month
- Also available via `/fund` command

### 4. Admin Settings Modal (Mobile App)
- Accessible from dashboard (gear icon, admin-only)
- Configure announcement group JID
- Enable/disable each announcement type
- Set reminder times (duty, schedule, assignment, birthday)
- Configure fund report day/time
- Customize message templates with {name} placeholder

## Backend Changes

### New Modules
- `apps/backend/src/settings/` - Settings management API
- `apps/backend/src/announcements/` - Bot data fetching API

### Database Schema Updates
Added to `Settings` model:
- `announcementGroupJid` - WhatsApp group for announcements
- `dutyReminderTime`, `scheduleReminderTime`, `assignmentReminderTime`, `birthdayReminderTime`
- `fundReportDay`, `fundReportTime`
- `dutyPersonalizedMessage`, `birthdayMessageTemplate`
- `ENABLE_WHATSAPP_BOT_ASSIGNMENT_REMINDER` flag

## WhatsApp Bot Changes

### New Modules
- `apps/whatsapp-bot/src/api/` - Backend API client
- `apps/whatsapp-bot/src/announcements/` - Scheduled jobs processor and scheduler

### Command Handlers (BaileysService)
- `handleAnnouncementAdd()` - Admin-only group JID configuration
- `handleFund()` - Fund info command
- `handleSchedule()` - Schedule command
- `handleAssignments()` - Assignments command

### Automated Jobs (AnnouncementsProcessor)
- `duty-reminder` - Daily duty announcement with personalized DMs
- `schedule-reminder` - Daily schedule announcement
- `assignment-reminder` - Daily assignment reminder
- `birthday-check` - Daily birthday check
- `fund-report` - Monthly fund report

### Scheduler (AnnouncementsScheduler)
- Runs every minute to check configured times
- Adds jobs to BullMQ queue when time matches

## Mobile App Changes

### New Screen
- `apps/mobile/app/modal/whatsapp-settings.tsx` - Admin settings modal

### Dashboard Updates
- Added settings gear icon for admin users
- Navigates to WhatsApp settings modal

## Environment Variables

Add to `apps/whatsapp-bot/.env`:
```
BACKEND_API_URL=http://localhost:3000
BOT_API_SECRET=your-secret-key (optional)
```

## Testing Checklist

- [ ] `/announcement add <jid>` - only admin can execute
- [ ] `/fund` - shows correct balance
- [ ] `/schedule` - shows today's schedule
- [ ] `/assignments` - shows pending assignments
- [ ] Duty reminder sends to group + private DMs
- [ ] Schedule reminder sends daily at configured time
- [ ] Assignment reminder sends daily at configured time
- [ ] Birthday check finds today's birthdays
- [ ] Fund report sends on configured day
- [ ] Mobile settings modal updates backend
- [ ] All times configurable via app

## Notes

- The scheduler checks every minute for matching times
- All reminder times are in 24-hour format (HH:MM)
- Fund report day is 1-31 (will not run in months with fewer days if set to 31)
- Message templates use `{name}` as placeholder for personalization
