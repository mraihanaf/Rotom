import type { JsonifiedClient } from '@orpc/openapi-client'
import type { ContractRouterClient } from '@orpc/contract'
import { createORPCClient } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { contract } from '@backend/contract'
import { getAuthCookieHeader } from './auth-client'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

const link = new OpenAPILink(contract, {
  url: API_URL,
  headers: async () => {
    return await getAuthCookieHeader()
  },
})

const client: JsonifiedClient<ContractRouterClient<typeof contract>> =
  createORPCClient(link)

export const orpc = createTanstackQueryUtils(client)

/**
 * Uploads a gallery media (photo or video) using multipart/form-data so the backend receives
 * a proper File object. The oRPC client serialises the input as JSON which
 * cannot carry a binary file; we bypass it here and call the endpoint directly.
 */
export async function uploadGalleryMedia(asset: {
  uri: string
  type?: string | null
  fileName?: string | null
  mediaType: 'image' | 'video'
}): Promise<void> {
  const headers = await getAuthCookieHeader()

  const formData = new FormData()

  // Determine proper MIME type and filename extension
  const isVideo = asset.mediaType === 'video'
  const defaultType = isVideo ? 'video/mp4' : 'image/jpeg'
  const defaultName = isVideo ? 'video.mp4' : 'photo.jpg'

  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName ?? defaultName,
    type: asset.type ?? defaultType,
  } as any)

  const res = await fetch(`${API_URL}/gallery/posts`, {
    method: 'POST',
    headers: {
      ...headers,
    },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `Upload failed with status ${res.status}`)
  }
}

// Backwards compatibility
export const uploadGalleryPhoto = (asset: {
  uri: string
  type?: string | null
  fileName?: string | null
}) => uploadGalleryMedia({ ...asset, mediaType: 'image' })

/**
 * Uploads a profile picture using multipart/form-data.
 */
export async function uploadProfilePicture(asset: {
  uri: string
  type?: string | null
  fileName?: string | null
}): Promise<void> {
  const headers = await getAuthCookieHeader()

  const formData = new FormData()

  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName ?? 'profile.jpg',
    type: asset.type ?? 'image/jpeg',
  } as any)

  const res = await fetch(`${API_URL}/profiles/image`, {
    method: 'POST',
    headers: {
      ...headers,
    },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `Upload failed with status ${res.status}`)
  }
}
