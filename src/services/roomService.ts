import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { Room } from '../types'
import { hashPassword, generateId } from '../utils/helpers'

const ROOMS = 'rooms'
const MESSAGES = 'messages'
const ACTIVE_USERS = 'activeUsers'
const TYPING = 'typing'

const ROOM_DURATION_MS = 60 * 60 * 1000 // 1 hour

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createRoom(
  roomName: string,
  password: string,
  ownerId: string,
  ownerName: string
): Promise<Room> {
  const roomId = generateId()
  const now = Timestamp.now()
  const expiresAt = Timestamp.fromMillis(Date.now() + ROOM_DURATION_MS)

  const data: Omit<Room, 'id'> = {
    name: roomName,
    passwordHash: hashPassword(password),
    ownerId,
    ownerName,
    createdAt: now,
    expiresAt,
    isActive: true,
  }

  await setDoc(doc(db, ROOMS, roomId), data)
  return { id: roomId, ...data }
}

// ─── Find / fetch ────────────────────────────────────────────────────────────

export async function findRoom(roomName: string): Promise<Room | null> {
  const q = query(
    collection(db, ROOMS),
    where('name', '==', roomName),
    where('isActive', '==', true)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null

  const room = { id: snap.docs[0].id, ...snap.docs[0].data() } as Room

  if (room.expiresAt.toMillis() < Date.now()) {
    await deactivateRoom(room.id)
    return null
  }

  return room
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  if (!snap.exists()) return null

  const room = { id: snap.id, ...snap.data() } as Room

  if (!room.isActive || room.expiresAt.toMillis() < Date.now()) {
  await deactivateRoom(room.id)
  return null
}

  return room
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateRoomPassword(room: Room, password: string): boolean {
  return room.passwordHash === hashPassword(password)
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateRoomPassword(roomId: string, newPassword: string): Promise<void> {
  await updateDoc(doc(db, ROOMS, roomId), {
    passwordHash: hashPassword(newPassword),
  })
}

// ─── Close / cleanup ─────────────────────────────────────────────────────────

/** Mark room inactive without deleting data yet */
async function deactivateRoom(roomId: string): Promise<void> {
  await updateDoc(doc(db, ROOMS, roomId), { isActive: false })
}

/** Close room and purge all related data */
export async function closeRoom(roomId: string): Promise<void> {
  try {
    const batch = writeBatch(db)

    // Delete messages
    const msgSnap = await getDocs(
      query(collection(db, MESSAGES), where('roomId', '==', roomId))
    )
    msgSnap.docs.forEach(d => batch.delete(d.ref))

    // Delete presence
    const usersSnap = await getDocs(
      query(collection(db, ACTIVE_USERS), where('roomId', '==', roomId))
    )
    usersSnap.docs.forEach(d => batch.delete(d.ref))

    // Delete typing indicators
    const typingSnap = await getDocs(
      query(collection(db, TYPING), where('roomId', '==', roomId))
    )
    typingSnap.docs.forEach(d => batch.delete(d.ref))

    // Delete room document
    batch.delete(doc(db, ROOMS, roomId))

    await batch.commit()
  } catch (err) {
    console.error('[roomService] closeRoom error:', err)
    throw err
  }
}

// ─── Realtime subscription ───────────────────────────────────────────────────

export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  return onSnapshot(doc(db, ROOMS, roomId), snapshot => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    const room = { id: snapshot.id, ...snapshot.data() } as Room
    if (!room.isActive || room.expiresAt.toMillis() < Date.now()) {
      callback(null)
      return
    }
    callback(room)
  })
}
