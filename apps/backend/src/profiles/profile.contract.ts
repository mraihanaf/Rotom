import { oc } from '@orpc/contract';
import { completeProfileInputSchema, profileSchema, updateProfileInputSchema } from './profile.schema';

const getMe = oc
  .route({
    path: '/profiles/me',
    method: 'GET',
    tags: ['Profile'],
  })
  .output(profileSchema);

const completeProfile = oc
  .route({
    path: '/profiles/complete',
    method: 'POST',
    tags: ['Profile'],
  })
  .input(completeProfileInputSchema);

const updateProfile = oc
  .route({
    path: '/profiles/update',
    method: 'PUT',
    tags: ['Profile'],
  })
  .input(updateProfileInputSchema)
  .output(profileSchema);

export const profilesContract = {
  getMe,
  completeProfile,
  updateProfile,
};
