import { oc } from '@orpc/contract';
import { z } from 'zod';
import { getAllUsersInputSchema, getAllUsersOutputSchema, userSchema } from './users.schema';

const getAll = oc
  .route({
    path: '/users',
    method: 'GET',
    tags: ['Users'],
  })
  .input(getAllUsersInputSchema)
  .output(getAllUsersOutputSchema);

const updateRole = oc
  .route({
    path: '/users/{id}/role',
    method: 'PUT',
    tags: ['Users'],
  })
  .input(z.object({ id: z.string(), role: z.string() }))
  .output(z.object({ success: z.boolean(), user: userSchema }));

export const usersContract = {
  getAll,
  updateRole,
};
