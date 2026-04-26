import { oc } from '@orpc/contract';
import z from 'zod';
import {
  completeProfileInputSchema,
  profileWithNameRequestSchema,
  updateProfileInputSchema,
  nameChangeRequestListSchema,
  approveNameChangeInputSchema,
  rejectNameChangeInputSchema,
  nameChangeRequestSchema,
} from './profile.schema';

const getMe = oc
  .route({
    path: '/profiles/me',
    method: 'GET',
    tags: ['Profile'],
  })
  .output(profileWithNameRequestSchema);

const completeProfile = oc
  .route({
    path: '/profiles/complete',
    method: 'POST',
    tags: ['Profile'],
  })
  .input(completeProfileInputSchema)
  .output(z.object({ nameRequestId: z.string() }));

const updateProfile = oc
  .route({
    path: '/profiles/update',
    method: 'PUT',
    tags: ['Profile'],
  })
  .input(updateProfileInputSchema)
  .output(profileWithNameRequestSchema);

const updateProfileImage = oc
  .route({
    path: '/profiles/image',
    method: 'POST',
    tags: ['Profile'],
  })
  .input(z.object({ file: z.instanceof(File) }));

// Admin name change request endpoints
const getPendingNameChangeRequests = oc
  .route({
    path: '/admin/name-change-requests/pending',
    method: 'GET',
    tags: ['Admin', 'NameChangeRequests'],
  })
  .output(nameChangeRequestListSchema);

const approveNameChangeRequest = oc
  .route({
    path: '/admin/name-change-requests/approve',
    method: 'POST',
    tags: ['Admin', 'NameChangeRequests'],
  })
  .input(approveNameChangeInputSchema)
  .output(z.object({
    request: nameChangeRequestSchema,
    previousName: z.string(),
    newName: z.string(),
  }));

const rejectNameChangeRequest = oc
  .route({
    path: '/admin/name-change-requests/reject',
    method: 'POST',
    tags: ['Admin', 'NameChangeRequests'],
  })
  .input(rejectNameChangeInputSchema)
  .output(nameChangeRequestSchema);

export const profilesContract = {
  getMe,
  completeProfile,
  updateProfile,
  updateProfileImage,
  getPendingNameChangeRequests,
  approveNameChangeRequest,
  rejectNameChangeRequest,
};
