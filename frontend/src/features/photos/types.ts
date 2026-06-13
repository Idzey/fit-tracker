export interface Photo {
  id: string
  clientId: string
  url: string
  thumbnailUrl: string | null
  note: string | null
  takenAt: string | null
  createdAt: string
}

export interface PresignUploadResponse {
  uploadUrl: string
  key: string
}

export interface ConfirmUploadPayload {
  key: string
  note?: string
  takenAt?: string
}
