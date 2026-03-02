import { oc } from '@orpc/contract';
import {
  createDutyInputSchema,
  deleteDutyByIdInputSchema,
  updateDutyInputSchema,
} from './duties.schema';
import { DutySchema } from './duties.schema';
import z from 'zod';

const createDuty = oc
  .route({
    path: '/duties',
    method: 'POST',
    tags: ['Duties'],
  })
  .input(createDutyInputSchema);

const deleteDutyById = oc
  .route({
    path: '/duties/{id}',
    method: 'DELETE',
    tags: ['Duties'],
  })
  .input(deleteDutyByIdInputSchema);

const updateDuty = oc
  .route({
    path: '/duties/{id}',
    method: 'PUT',
    tags: ['Duties'],
  })
  .input(updateDutyInputSchema);

const getAllDuties = oc
  .route({
    path: '/duties',
    method: 'GET',
    tags: ['Duties'],
  })
  .output(z.array(DutySchema));

export const dutiesContract = {
  createDuty,
  deleteDutyById,
  updateDuty,
  getAllDuties,
};
