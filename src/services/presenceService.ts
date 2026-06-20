import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { ActiveUser } from '../types'

const ACTIVE_USERS = 'activeUsers'
const TYPING = 'typing'

const PRESENCE_STALE_MS = 60_000 // users unseen > 60s are considered offline

// ─── Presence ────────────────────────────────────────────────────────────────

export async function joinRoom(
  roomId: string,
  userId: string,
  displayName: string
): Promise<void> {
  await setDoc(doc(db, ACTIVE_USERS, `${roomId}_${userId}`), {
    userId,
    displayName,
    roomId,
    lastSeen: Timestamp.now(),
  })
}

export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  await Promise.all([
    deleteDoc(doc(db, ACTIVE_USERS, `${roomId}_${userId}`)).catch(() => {}),
    clearTyping(roomId, userId),
  ])
}

export async function updatePresence(roomId: string, userId: string): Promise<void> {
  await setDoc(
    doc(db, ACTIVE_USERS, `${roomId}_${userId}`),
    { lastSeen: Timestamp.now() },
    { merge: true }
  )
}

export function subscribeToActiveUsers(
  roomId: string,
  callback: (users: ActiveUser[]) => void
): () => void {
  const q = query(collection(db, ACTIVE_USERS), where('roomId', '==', roomId))

  return onSnapshot(q, snapshot => {
    const cutoff = Date.now() - PRESENCE_STALE_MS
    const users = snapshot.docs
      .map(d => d.data() as ActiveUser)
      .filter(u => (u.lastSeen?.toMillis() ?? 0) > cutoff)

    callback(users)
  })
}

// ─── Typing ──────────────────────────────────────────────────────────────────

export async function setTyping(
  roomId: string,
  userId: string,
  displayName: string
): Promise<void> {
  await setDoc(doc(db, TYPING, `${roomId}_${userId}`), {
    userId,
    displayName,
    roomId,
    timestamp: Timestamp.now(),
  })
}

export async function clearTyping(roomId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, TYPING, `${roomId}_${userId}`)).catch(() => {})
}

export function subscribeToTyping(
  roomId: string,
  currentUserId: string,
  callback: (names: string[]) => void
): () => void {
  const q = query(collection(db, TYPING), where('roomId', '==', roomId))
  const TYPING_STALE_MS = 5_000

  return onSnapshot(q, snapshot => {
    const cutoff = Date.now() - TYPING_STALE_MS
    const names = snapshot.docs
      .map(d => d.data())
      .filter(d => d.userId !== currentUserId && (d.timestamp?.toMillis() ?? 0) > cutoff)
      .map(d => d.displayName as string)

    callback(names)
  })
}
