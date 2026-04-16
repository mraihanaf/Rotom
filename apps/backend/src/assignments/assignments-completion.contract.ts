import { oc } from '@orpc/contract';
import z from 'zod';

const studentCompletionSchema = z.object({
  userId: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  done: z.boolean(),
});

const assignmentWithCompletionsSchema = z.object({
  assignmentId: z.string(),
  title: z.string(),
  dueDate: z.date(),
  description: z.string().nullable(),
  totalStudents: z.number(),
  completedCount: z.number(),
  completionPercentage: z.number(),
  students: z.array(studentCompletionSchema),
});

const subjectWithAssignmentsSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string(),
  assignments: z.array(z.object({
    assignmentId: z.string(),
    title: z.string(),
    dueDate: z.date(),
    totalStudents: z.number(),
    completedCount: z.number(),
    completionPercentage: z.number(),
  })),
});

const getCompletionStatsOutputSchema = z.object({
  subjects: z.array(subjectWithAssignmentsSchema),
  overallStats: z.object({
    totalStudents: z.number(),
    totalAssignments: z.number(),
    totalCompletions: z.number(),
    overallPercentage: z.number(),
  }),
});

const getAssignmentCompletionsInputSchema = z.object({
  assignmentId: z.string(),
});

const getAssignmentCompletionsOutputSchema = assignmentWithCompletionsSchema;

const getCompletionStats = oc
  .route({
    path: '/assignments/completion-stats',
    method: 'GET',
    tags: ['Assignments'],
  })
  .output(getCompletionStatsOutputSchema);

const getAssignmentCompletions = oc
  .route({
    path: '/assignments/{id}/completions',
    method: 'GET',
    tags: ['Assignments'],
  })
  .input(z.object({ id: z.string() }))
  .output(getAssignmentCompletionsOutputSchema);

export const assignmentsCompletionContract = {
  getCompletionStats,
  getAssignmentCompletions,
};
