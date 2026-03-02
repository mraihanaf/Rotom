import type { JsonifiedClient } from '@orpc/openapi-client'
import type { ContractRouterClient } from '@orpc/contract'
import { createORPCClient } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { contract } from '@backend/contract'
import { getAuthCookieHeader } from './auth-client'

const API_URL = 'http://10.4.6.229:3000'

const link = new OpenAPILink(contract, {
  url: API_URL,
  headers: async () => {
    return await getAuthCookieHeader()
  },
})

const client: JsonifiedClient<ContractRouterClient<typeof contract>> =
  createORPCClient(link)

export const orpc = createTanstackQueryUtils(client)
