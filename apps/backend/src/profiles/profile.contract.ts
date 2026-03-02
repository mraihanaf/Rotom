import { oc } from '@orpc/contract';
import { profileSchema } from './profile.schema';

const getMe = oc
  .route({
    path: '/profiles/me',
    method: 'GET',
    tags: ['Profile'],
  })
  .output(profileSchema);

export const profilesContract = oc.router({
  getMe,
});
