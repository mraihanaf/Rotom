import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  dutyPersonSchema,
  scheduleItemSchema,
  assignmentSchema,
  birthdayPersonSchema,
  fundReportSchema,
  announcementSettingsSchema,
} from './announcements.schema';

const getTodayDuties = oc
  .route({
    path: '/announcements/duties/today',
    method: 'GET',
    tags: ['Announcements'],
  })
  .output(z.array(dutyPersonSchema));

const getTodaySchedule = oc
  .route({
    path: '/announcements/schedule/today',
    method: 'GET',
    tags: ['Announcements'],
  })
  .output(z.array(scheduleItemSchema));

const getPendingAssignments = oc
  .route({
    path: '/announcements/assignments/pending',
    method: 'GET',
    tags: ['Announcements'],
  })
  .output(z.array(assignmentSchema));

const getTodayBirthdays = oc
  .route({
    path: '/announcements/birthdays/today',
    method: 'GET',
    tags: ['Announcements'],
  })
  .output(z.array(birthdayPersonSchema));

const getFundReport = oc
  .route({
    path: '/announcements/fund-report',
    method: 'GET',
    tags: ['Announcements'],
  })
  .output(fundReportSchema);

const getAnnouncementSettings = oc
  .route({
    path: '/announcements/settings',
    method: 'GET',
    tags: ['Announcements'],
  })
  .output(announcementSettingsSchema);

const isAdminByPhone = oc
  .route({
    path: '/announcements/check-admin',
    method: 'GET',
    tags: ['Announcements'],
  })
  .input(z.object({ phoneNumber: z.string() }))
  .output(z.object({ isAdmin: z.boolean() }));

const updateAnnouncementGroup = oc
  .route({
    path: '/announcements/group',
    method: 'PUT',
    tags: ['Announcements'],
  })
  .input(z.object({ phoneNumber: z.string(), groupJid: z.string() }))
  .output(z.object({ success: z.boolean() }));

export const announcementsContract = {
  getTodayDuties,
  getTodaySchedule,
  getPendingAssignments,
  getTodayBirthdays,
  getFundReport,
  getAnnouncementSettings,
  isAdminByPhone,
  updateAnnouncementGroup,
};
