import { oc } from '@orpc/contract';
import {
  getScheduleByDayInputSchema,
  getScheduleByDayOutputSchema,
  getWeekScheduleOutputSchema,
  createScheduleInputSchema,
  scheduleSchema,
  updateScheduleInputSchema,
  deleteScheduleInputSchema,
} from './schedules.schema';

const getByDay = oc
  .route({ path: '/schedules/day', method: 'GET', tags: ['Schedules'] })
  .input(getScheduleByDayInputSchema)
  .output(getScheduleByDayOutputSchema);

const getWeek = oc
  .route({ path: '/schedules/week', method: 'GET', tags: ['Schedules'] })
  .output(getWeekScheduleOutputSchema);

const create = oc
  .route({ path: '/schedules', method: 'POST', tags: ['Schedules'] })
  .input(createScheduleInputSchema)
  .output(scheduleSchema);

const update = oc
  .route({ path: '/schedules/{id}', method: 'PUT', tags: ['Schedules'] })
  .input(updateScheduleInputSchema);

const deleteById = oc
  .route({ path: '/schedules/{id}', method: 'DELETE', tags: ['Schedules'] })
  .input(deleteScheduleInputSchema);

export const schedulesContract = {
  getByDay,
  getWeek,
  create,
  update,
  deleteById,
};
