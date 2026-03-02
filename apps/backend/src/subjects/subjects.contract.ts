import { oc } from '@orpc/contract';
import {
  createSubjectInputSchema,
  deleteSubjectByIdInputSchema,
  getAllSubjectsInputSchema,
  getAllSubjectsOutputSchema,
  updateSubjectInputSchema,
} from './subjects.schema';

const create = oc
  .route({
    path: '/subjects',
    method: 'POST',
    tags: ['Subjects'],
  })
  .input(createSubjectInputSchema);

const updateById = oc
  .route({
    path: '/subjects/{id}',
    method: 'PUT',
    tags: ['Subjects'],
  })
  .input(updateSubjectInputSchema);

const deleteById = oc
  .route({
    path: '/subjects/{id}',
    method: 'DELETE',
    tags: ['Subjects'],
  })
  .input(deleteSubjectByIdInputSchema);

const getAll = oc
  .route({
    path: '/subjects',
    method: 'GET',
    tags: ['Subjects'],
  })
  .input(getAllSubjectsInputSchema)
  .output(getAllSubjectsOutputSchema);

export const subjectsContract = {
  create,
  updateById,
  deleteById,
  getAll,
};
