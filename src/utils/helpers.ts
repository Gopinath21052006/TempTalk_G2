import { Timestamp } from 'firebase/firestore'

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

export function generateUserId(): string {
  return 'user_' + generateId()
}

/**
 * Lightweight deterministic hash — good enough for a demo room password.
 * Production deployments should use Firebase Cloud Functions + bcrypt.
 */
export function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // coerce to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

export function formatMessageTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return ''
  return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatCountdown(expiresAt: Timestamp): string {
  const diff = expiresAt.toMillis() - Date.now()
  if (diff <= 0) return 'Expired'

  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)

  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getUserColor(userId: string): string {
  const palette = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-yellow-500',
    'bg-red-500',
  ]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

// ─── Media / file helpers ───────────────────────────────────────────────────

/** Human-readable file size, e.g. 1536 -> "1.5 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`
}

/** mm:ss formatting for voice note duration / playback. */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Best-effort file extension, uppercased, derived from a filename. */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.')
  if (parts.length < 2) return 'FILE'
  return parts[parts.length - 1].toUpperCase()
}
