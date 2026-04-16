import { oc } from '@orpc/contract';
import {
  createDutyTypeInputSchema,
  updateDutyTypeInputSchema,
  deleteDutyTypeInputSchema,
  dutyTypeSchema,
  createDutyScheduleInputSchema,
  updateDutyScheduleInputSchema,
  deleteDutyScheduleInputSchema,
  updateDutyStatusInputSchema,
  dutyScheduleSchema,
  weekScheduleOutputSchema,
  getWeekDutiesInputSchema,
} from './duties.schema';
import z from 'zod';

// Duty Type endpoints
const createDutyType = oc
  .route({
    path: '/duties/types',
    method: 'POST',
    tags: ['Duties'],
  })
  .input(createDutyTypeInputSchema)
  .output(dutyTypeSchema);

const updateDutyType = oc
  .route({
    path: '/duties/types/{id}',
    method: 'PUT',
    tags: ['Duties'],
  })
  .input(updateDutyTypeInputSchema)
  .output(dutyTypeSchema);

const deleteDutyType = oc
  .route({
    path: '/duties/types/{id}',
    method: 'DELETE',
    tags: ['Duties'],
  })
  .input(deleteDutyTypeInputSchema);

const getAllDutyTypes = oc
  .route({
    path: '/duties/types',
    method: 'GET',
    tags: ['Duties'],
  })
  .output(z.array(dutyTypeSchema));

// Duty Schedule endpoints
const createDutySchedule = oc
  .route({
    path: '/duties/schedules',
    method: 'POST',
    tags: ['Duties'],
  })
  .input(createDutyScheduleInputSchema)
  .output(dutyScheduleSchema);

const updateDutySchedule = oc
  .route({
    path: '/duties/schedules/{id}',
    method: 'PUT',
    tags: ['Duties'],
  })
  .input(updateDutyScheduleInputSchema)
  .output(dutyScheduleSchema);

const deleteDutySchedule = oc
  .route({
    path: '/duties/schedules/{id}',
    method: 'DELETE',
    tags: ['Duties'],
  })
  .input(deleteDutyScheduleInputSchema);

const updateDutyStatus = oc
  .route({
    path: '/duties/schedules/{id}/status',
    method: 'PATCH',
    tags: ['Duties'],
  })
  .input(updateDutyStatusInputSchema)
  .output(dutyScheduleSchema);

const getWeekDuties = oc
  .route({
    path: '/duties/week',
    method: 'GET',
    tags: ['Duties'],
  })
  .input(getWeekDutiesInputSchema)
  .output(weekScheduleOutputSchema);

export const dutiesContract = {
  // Duty Types
  createDutyType,
  updateDutyType,
  deleteDutyType,
  getAllDutyTypes,
  // Duty Schedules
  createDutySchedule,
  updateDutySchedule,
  deleteDutySchedule,
  updateDutyStatus,
  getWeekDuties,
};
