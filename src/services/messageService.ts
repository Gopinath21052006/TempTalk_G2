import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Message, MessageType } from '../types'
import { uploadAudio, uploadFile, uploadImage } from './cloudinaryService'

const MESSAGES = 'messages'

// ─── Internal ────────────────────────────────────────────────────────────────

interface BaseSender {
  roomId: string
  senderId: string
  senderName: string
}

/** Builds a Firestore-safe payload — Firestore rejects `undefined` field values. */
function buildPayload(
  base: BaseSender,
  type: MessageType,
  content: string,
  media?: Partial<Pick<Message, 'fileUrl' | 'fileName' | 'fileSize' | 'mimeType' | 'duration'>>
): Omit<Message, 'id'> {
  const payload: Omit<Message, 'id'> = {
    roomId: base.roomId,
    senderId: base.senderId,
    senderName: base.senderName,
    type,
    content,
    timestamp: Timestamp.now(),
  }

  if (media) {
    for (const [key, value] of Object.entries(media)) {
      if (value !== undefined) {
        ;(payload as Record<string, unknown>)[key] = value
      }
    }
  }

  return payload
}

// ─── Send: text ──────────────────────────────────────────────────────────────

export async function sendTextMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  content: string
): Promise<void> {
  const trimmed = content.trim()
  if (!trimmed) return

  await addDoc(
    collection(db, MESSAGES),
    buildPayload({ roomId, senderId, senderName }, MessageType.TEXT, trimmed)
  )
}

// ─── Send: image ─────────────────────────────────────────────────────────────

export async function sendImageMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  file: File,
  caption: string = ''
): Promise<void> {
  const result = await uploadImage(file)

  await addDoc(
    collection(db, MESSAGES),
    buildPayload({ roomId, senderId, senderName }, MessageType.IMAGE, caption.trim(), {
      fileUrl: result.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'image/jpeg',
    })
  )
}

// ─── Send: file ──────────────────────────────────────────────────────────────

export async function sendFileMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  file: File
): Promise<void> {
  const result = await uploadFile(file)

  await addDoc(
    collection(db, MESSAGES),
    buildPayload({ roomId, senderId, senderName }, MessageType.FILE, '', {
      fileUrl: result.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    })
  )
}

// ─── Send: voice note ────────────────────────────────────────────────────────

export async function sendAudioMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  blob: Blob,
  durationSeconds: number
): Promise<void> {
  const fileName = `voice-note-${Date.now()}.webm`
  const result = await uploadAudio(blob, fileName)

  await addDoc(
    collection(db, MESSAGES),
    buildPayload({ roomId, senderId, senderName }, MessageType.AUDIO, '', {
      fileUrl: result.url,
      fileName,
      fileSize: blob.size,
      mimeType: blob.type || 'audio/webm',
      duration: Math.round(durationSeconds),
    })
  )
}

// ─── Subscribe ───────────────────────────────────────────────────────────────

/**
 * Subscribe to messages for a room.
 * Fetches by roomId only (no composite index required).
 * Sorts client-side by timestamp ascending.
 */
export function subscribeToMessages(
  roomId: string,
  callback: (messages: Message[]) => void
): () => void {
  const q = query(collection(db, MESSAGES), where('roomId', '==', roomId))

  return onSnapshot(q, snapshot => {
    const messages = snapshot.docs
      .map(d => {
        const data = d.data()
        return {
          id: d.id,
          ...data,
          // Defensive default for any pre-existing text-only documents.
          type: (data.type as MessageType) ?? MessageType.TEXT,
        } as Message
      })
      .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())

    callback(messages)
  })
}
