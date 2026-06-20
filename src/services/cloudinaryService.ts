/**
 * Cloudinary upload service.
 *
 * TempTalk is backend-free: there is no server to sign upload requests, so
 * every upload uses Cloudinary's **unsigned upload** flow via a preset
 * configured in the Cloudinary console (Settings → Upload → Upload presets
 * → add an "Unsigned" preset).
 *
 * Required environment variables (see .env.example):
 *   VITE_CLOUDINARY_CLOUD_NAME
 *   VITE_CLOUDINARY_UPLOAD_PRESET
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined

/** Cloudinary's three upload endpoints. Audio is uploaded as a 'video' resource — Cloudinary has no separate 'audio' type. */
type CloudinaryResourceType = 'image' | 'video' | 'raw'

export interface CloudinaryUploadResult {
  url: string
  bytes: number
  format?: string
}

function assertConfigured(): void {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and ' +
        'VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
    )
  }
}

async function uploadToCloudinary(
  blob: Blob,
  resourceType: CloudinaryResourceType,
  fileName: string
): Promise<CloudinaryUploadResult> {
  assertConfigured()

  const formData = new FormData()
  formData.append('file', blob, fileName)
  formData.append('upload_preset', UPLOAD_PRESET as string)

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`

  let res: Response
  try {
    res = await fetch(endpoint, { method: 'POST', body: formData })
  } catch {
    throw new Error('Network error while uploading to Cloudinary.')
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => null)
    const message = errBody?.error?.message ?? `Upload failed with status ${res.status}`
    throw new Error(message)
  }

  const data = await res.json()
  return {
    url: data.secure_url as string,
    bytes: (data.bytes as number) ?? blob.size,
    format: data.format as string | undefined,
  }
}

/** Upload an image file (jpg, png, gif, webp, etc). */
export async function uploadImage(file: File): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'image', file.name)
}

/**
 * Upload a recorded voice note. Cloudinary stores audio under its 'video'
 * resource type — this still returns a playable audio URL.
 */
export async function uploadAudio(
  blob: Blob,
  fileName: string = `voice-note-${Date.now()}.webm`
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(blob, 'video', fileName)
}

/** Upload an arbitrary file (PDF, DOCX, TXT, ZIP, etc) via Cloudinary's raw endpoint. */
export async function uploadFile(file: File): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, 'raw', file.name)
}
