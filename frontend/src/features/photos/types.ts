export type PhotoStatus = 'PENDING' | 'UPLOADED' | 'READY' | 'FAILED'

export interface Photo {
  id: string
  clientId: string
  key: string
  thumbnailKey: string | null
  size: number
  status: PhotoStatus
  url: string
  thumbnailUrl: string | null
  takenAt: string | null
  uploadedAt: string | null
  createdAt: string
}

export interface BackendPhoto {
  id: string
  clientId: string
  key: string
  thumbnailKey: string | null
  size: number
  status: PhotoStatus
  takenAt: string | null
  uploadedAt: string | null
  createdAt: string
}

export interface BackendPhotoListResponse {
  data: BackendPhoto[]
  pagination: { page: number; limit: number; total: number; hasMore: boolean }
}

export interface PhotoUrlResponse {
  url: string
  expiresAt: string
}

export interface PresignUploadPayload {
  contentType: string
  size: number
  takenAt?: string
}

export interface PresignUploadResponse {
  uploadUrl: string
  photoId: string
  key: string
  expiresAt: string
}

export interface ConfirmUploadPayload {
  photoId: string
}

