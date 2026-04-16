import { oc } from '@orpc/contract';
import z from 'zod';

const dashboardSummarySchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
    role: z.string().nullable(),
    birthday: z.date().nullable(),
  }),
  fund: z.object({
    totalAmount: z.number(),
    currency: z.string(),
  }),
  todaySchedule: z.array(z.object({
    id: z.string(),
    subjectId: z.string(),
    subjectName: z.string(),
    dayOfWeek: z.number(),
    startTime: z.string(),
    endTime: z.string(),
    room: z.string().nullable(),
  })),
  pendingAssignments: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    dueDate: z.date(),
    subject: z.object({
      id: z.string(),
      name: z.string(),
    }),
    done: z.boolean(),
  })),
  assignmentStats: z.object({
    total: z.number(),
    completed: z.number(),
    pending: z.number(),
    percentage: z.number(),
  }),
});

const getDashboardSummary = oc
  .route({
    path: '/dashboard/summary',
    method: 'GET',
    tags: ['Dashboard'],
  })
  .output(dashboardSummarySchema);

export const dashboardContract = {
  getDashboardSummary,
};
