import { oc } from '@orpc/contract';
import {
  createFundContributionInputSchema,
  deleteFundContributionByIdInputSchema,
  fundSchema,
  getAllContributionsInputSchema,
  getAllContributionsOuputSchema,
} from './funds.schema';

const getFund = oc
  .route({
    path: '/funds',
    method: 'GET',
    tags: ['Funds'],
  })
  .output(fundSchema);

const getAllContributions = oc
  .route({
    path: '/funds/contributions',
    method: 'GET',
    tags: ['Funds'],
  })
  .input(getAllContributionsInputSchema)
  .output(getAllContributionsOuputSchema);

const createContribution = oc
  .route({
    path: '/funds/contributions',
    method: 'POST',
    tags: ['Funds'],
  })
  .input(createFundContributionInputSchema);

const deleteContributionById = oc
  .route({
    path: '/funds/contributions/{id}',
    method: 'DELETE',
    tags: ['Funds'],
  })
  .input(deleteFundContributionByIdInputSchema);

export const fundsContract = {
  getFund,
  createContribution,
  deleteContributionById,
  getAllContributions,
};
