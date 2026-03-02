import { oc } from '@orpc/contract';
import {
  assignmentInputSchema,
  createAssignmentInputSchema,
  getAllAssignmentsInputSchema,
  getAllAssignmentsOutputSchema,
  updateAssignmentInputSchema,
} from './assignments.schema';

const markAssignment = oc
  .route({
    path: '/assignments/{id}/done',
    method: 'POST',
    tags: ['Assignments'],
  })
  .input(assignmentInputSchema);

const unmarkAssignment = oc
  .route({
    path: '/assignments/{id}/done',
    method: 'DELETE',
    tags: ['Assignments'],
  })
  .input(assignmentInputSchema);

const createAssignment = oc
  .route({
    path: '/assignments',
    method: 'POST',
    tags: ['Assignments'],
  })
  .input(createAssignmentInputSchema);

const updateAssignment = oc
  .route({
    path: '/assignments/{id}',
    method: 'PUT',
    tags: ['Assignments'],
  })
  .input(updateAssignmentInputSchema);

const deleteAssignment = oc
  .route({
    path: '/assignments/{id}',
    method: 'DELETE',
    tags: ['Assignments'],
  })
  .input(assignmentInputSchema);

const getAllAssignments = oc
  .route({
    path: '/assignments',
    method: 'GET',
    tags: ['Assignments'],
  })
  .input(getAllAssignmentsInputSchema)
  .output(getAllAssignmentsOutputSchema);

export const assignmentsContract = {
  markAssignment,
  updateAssignment,
  unmarkAssignment,
  createAssignment,
  deleteAssignment,
  getAllAssignments,
};
