import { oc } from '@orpc/contract';
import { getAllUsersInputSchema, getAllUsersOutputSchema } from './users.schema';

const getAll = oc
  .route({
    path: '/users',
    method: 'GET',
    tags: ['Users'],
  })
  .input(getAllUsersInputSchema)
  .output(getAllUsersOutputSchema);

export const usersContract = {
  getAll,
};
