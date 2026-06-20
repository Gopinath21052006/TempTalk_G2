import { Timestamp } from 'firebase/firestore'

// ─── Firestore Documents ────────────────────────────────────────────────────

export interface Room {
  id: string
  name: string
  passwordHash: string
  ownerId: string
  ownerName: string
  createdAt: Timestamp
  expiresAt: Timestamp
  isActive: boolean
}

/**
 * Discriminates the kind of payload a message carries.
 * TEXT messages use `content` only. IMAGE / FILE / AUDIO messages carry
 * media metadata (fileUrl, fileName, fileSize, mimeType) in addition to an
 * optional `content` caption.
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  senderName: string
  type: MessageType
  /** Text body for TEXT messages, optional caption for media messages. */
  content: string
  timestamp: Timestamp

  // ── Media metadata — present when type is IMAGE, FILE, or AUDIO ──────────
  /** Cloudinary secure URL of the uploaded asset. */
  fileUrl?: string
  /** Original file name (or a generated name for voice notes). */
  fileName?: string
  /** Size of the uploaded asset in bytes. */
  fileSize?: number
  /** MIME type of the uploaded asset, e.g. 'image/png', 'application/pdf'. */
  mimeType?: string
  /** Duration in seconds — set for AUDIO (voice note) messages. */
  duration?: number
}

export interface ActiveUser {
  userId: string
  displayName: string
  roomId: string
  lastSeen: Timestamp
}

export interface TypingIndicator {
  userId: string
  displayName: string
  roomId: string
  timestamp: Timestamp
}

// ─── Session / Forms ────────────────────────────────────────────────────────

export interface UserSession {
  userId: string
  displayName: string
}

export interface CreateRoomForm {
  displayName: string
  roomName: string
  password: string
}

export interface JoinRoomForm {
  displayName: string
  roomName: string
  password: string
}
