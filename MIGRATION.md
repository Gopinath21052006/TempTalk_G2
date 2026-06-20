# Migration Notes: TempTalk v1 → G2 (with media restored)

## Overview

TempTalk G2 originally shipped as a **text-only refactor** of v1 that dropped voice notes, image sharing, and file sharing. This revision of G2 **restores all three media features** while keeping the cleaner G2 architecture (no `lastActivity` field, no Firebase Storage, separate `typing` collection, sync password validation, etc).

The net result: G2 now has full feature parity with v1's media capabilities, but on a simpler, more maintainable foundation — and still with **zero application backend**. Media uploads go straight from the browser to **Cloudinary** instead of Firebase Storage.

---

## What changed in this revision

### 1. Firestore Schema

#### `messages` collection — media fields are back, under a new shape

```diff
  {
    roomId:     string
    senderId:   string
    senderName: string
+   type:       'text' | 'image' | 'file' | 'audio'
    content:    string
    timestamp:  Timestamp
+   fileUrl?:   string    // Cloudinary secure URL (image/file/audio only)
+   fileName?:  string
+   fileSize?:  number
+   mimeType?:  string
+   duration?:  number    // seconds, audio only
  }
```

This is **not** a byte-for-byte restoration of the v1 schema — field names match v1 (`fileUrl`, `fileName`, `fileSize`, `mimeType`), but URLs now point to **Cloudinary**, not Firebase Storage, and a `type` discriminant (`MessageType` enum) replaces any ad-hoc type string.

`content` is still always present: for `TEXT` messages it's the message body; for media messages it's an optional caption (empty string if none was provided).

---

### 2. New / restored files

| File | Purpose |
|---|---|
| `src/services/cloudinaryService.ts` | **New.** Unsigned uploads to Cloudinary's `image`, `video` (used for audio), and `raw` (used for files) endpoints. |
| `src/hooks/useVoiceRecorder.ts` | **Restored**, reimplemented against the native `MediaRecorder` API. Exposes `isRecording`, `recordingSeconds`, `startRecording`, `stopRecording`, `cancelRecording`. |
| `src/utils/helpers.ts` | **Extended** with `formatFileSize`, `formatDuration`, `getFileExtension`. |

Nothing was removed — v1's `Firebase Storage` integration is intentionally **not** restored. Cloudinary replaces it entirely (see "Why Cloudinary, not Firebase Storage" below).

---

### 3. Changed API Signatures

#### `messageService`

```diff
// Previous G2 (text-only)
- sendMessage(roomId, senderId, senderName, content)

// Current
+ sendTextMessage(roomId, senderId, senderName, content)
+ sendImageMessage(roomId, senderId, senderName, file, caption?)
+ sendFileMessage(roomId, senderId, senderName, file)
+ sendAudioMessage(roomId, senderId, senderName, blob, durationSeconds)
```

`subscribeToMessages` is unchanged in signature, but now defensively defaults `type` to `'text'` for any pre-existing documents written before this migration (so old rooms don't break mid-flight).

#### `MessageInput` props

```diff
// Previous G2
- onSendText: (text: string) => Promise<void>

// Current
+ onSendText:  (text: string) => Promise<void>
+ onSendImage: (file: File) => Promise<void>
+ onSendFile:  (file: File) => Promise<void>
+ onSendAudio: (blob: Blob, durationSeconds: number) => Promise<void>
```

#### `MessageBubble`

No prop changes — it still takes `message`, `isSelf`, `showAvatar` — but it now branches on `message.type` to render an image preview, an inline audio player, or a file download card instead of always rendering plain text.

---

### 4. Firestore Rules

```diff
  match /messages/{messageId} {
    allow read:   if true;
    allow create: if request.resource.data.keys().hasAll([
-     'roomId','senderId','senderName','content','timestamp'
+     'roomId','senderId','senderName','type','content','timestamp'
-   ]);
+   ]) && request.resource.data.type in ['text', 'image', 'file', 'audio'];
    allow delete: if true;
  }
```

Run `firebase deploy --only firestore:rules` after pulling this change.

---

### 5. New Environment Variables

```diff
  VITE_FIREBASE_API_KEY=...
  VITE_FIREBASE_AUTH_DOMAIN=...
  VITE_FIREBASE_PROJECT_ID=...
  VITE_FIREBASE_STORAGE_BUCKET=...   # still unused — kept for SDK init only
  VITE_FIREBASE_MESSAGING_SENDER_ID=...
  VITE_FIREBASE_APP_ID=...
+ VITE_CLOUDINARY_CLOUD_NAME=...
+ VITE_CLOUDINARY_UPLOAD_PRESET=...
```

The Cloudinary preset **must** be created with **Signing Mode: Unsigned** — there's no server available to sign requests.

---

### 6. Dependency Changes

```diff
// No new npm dependencies were added.
```

Voice recording uses the native `MediaRecorder` browser API (no package). Cloudinary uploads use the native `fetch` + `FormData` (no Cloudinary SDK). This keeps the bundle size and the "backend-free" guarantee intact.

---

## Why Cloudinary, not Firebase Storage?

The product requirement is explicit: **no Firebase Storage, Firestore + Cloudinary only**. Practically, this means:

- Firestore remains the single source of truth for rooms, users, presence, and message metadata — completely unchanged in role.
- Cloudinary is used purely as **object storage with a CDN**, addressed via unsigned uploads from the client.
- No Node.js/Cloud Functions server was introduced to broker uploads — the browser talks directly to Cloudinary's REST API.

This preserves the "backend-free, deploy-anywhere-as-static-files" property of the original G2 refactor while adding back full media support.

---

## Data Migration

**There is no automatic migration path**, consistent with the original G2 notes — rooms expire after 1 hour, so v1 and pre-media-restoration G2 rooms will simply expire on their own. No Firestore migration script is required for a standard deployment.

If you have long-lived data you must migrate:

1. Any `messages` documents missing a `type` field are treated as `'text'` by `subscribeToMessages` — no action needed, but consider backfilling `type: 'text'` for cleanliness.
2. If you have v1 documents with `fileUrl` values pointing at Firebase Storage, those links still work for reading existing files, but new uploads will always go to Cloudinary. There's no automatic Storage → Cloudinary asset migration; write a one-off script if you need to preserve old media long-term.

---

## Summary

| Area | Previous G2 (text-only) | Current |
|---|---|---|
| Message types | text only | `text`, `image`, `file`, `audio` |
| Media storage | none | Cloudinary (unsigned uploads) |
| Firebase Storage | ❌ removed | ❌ still not used |
| Voice recorder hook | ❌ removed | ✅ restored (`MediaRecorder` API) |
| Image/file upload service | ❌ removed | ✅ restored (`cloudinaryService.ts`) |
| Composite Firestore indexes | none required | none required |
| New npm dependencies | — | none |
| Backend / server | none | none |
