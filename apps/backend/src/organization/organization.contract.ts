import { oc } from '@orpc/contract';
import {
  getOrganizationSchema,
  updateOrganizationINputSchema,
  updateOrganizationLogoInputSchema,
} from './organization.schema';

const getOrganization = oc
  .route({
    path: '/organization',
    method: 'GET',
    tags: ['Organization'],
  })
  .output(getOrganizationSchema);

const updateOrganization = oc
  .route({
    path: '/organization',
    method: 'PUT',
    tags: ['Organization'],
  })
  .input(updateOrganizationINputSchema);

const updateOrganizationLogo = oc
  .route({
    path: '/organization/logo',
    method: 'PUT',
    tags: ['Organization'],
  })
  .input(updateOrganizationLogoInputSchema);

export const organizationContract = {
  getOrganization,
  updateOrganization,
  updateOrganizationLogo,
};
