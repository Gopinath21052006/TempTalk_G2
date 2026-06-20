# TempTalk G2

> **Temporary group chat. No account. No trace. Gone in an hour.**

TempTalk is a lightweight, mobile-first chat application built with React, TypeScript, Firebase Firestore, Cloudinary, and Tailwind CSS. Rooms auto-expire after 60 minutes — no sign-up, no permanent data, and **no application backend** of any kind.

---

## Features

| Feature | Details |
|---|---|
| 🚀 Create a room | Password-protected, expires in 1 hour |
| 🔑 Join a room | Enter room name + password |
| 💬 Realtime chat | Text messages, live updates via Firestore |
| 🎙️ Voice notes | Record in-browser with `MediaRecorder`, playback inline |
| 🖼️ Image sharing | Pick a photo, preview it inline in the chat |
| 📎 File sharing | Share PDFs, DOCX, TXT, ZIP, and more as download cards |
| 👥 Online presence | See who's in the room |
| ✍️ Typing indicators | See who's currently typing |
| ⏱️ Expiry countdown | Live timer in the header |
| 👑 Owner controls | Change password, kick users, close room |
| 📱 Mobile-first | WhatsApp/Telegram-inspired dark UI |
| 🛡️ TypeScript strict mode | `strict`, `noUnusedLocals`, `noUnusedParameters` all on |

---

## Tech Stack

- **React 18** + **TypeScript 5**
- **Vite 7** — fast dev & build
- **Firebase Firestore** — realtime database (rooms, messages, presence, typing — **no Firebase Storage**)
- **Cloudinary** — unsigned client-side uploads for images, voice notes, and files
- **MediaRecorder API** — native browser audio recording, no native modules
- **React Router v6** — client-side routing
- **Tailwind CSS v3** — utility-first styling
- **React Hot Toast** — notification system
- **Lucide React** — icon library

There is **no Node.js server**. Every upload goes straight from the browser to Cloudinary using an unsigned upload preset; every chat read/write goes straight to Firestore. This keeps the app fully static and deployable to any static host (Firebase Hosting, Vercel, Netlify, etc).

---

## Getting Started

### 1. Clone & install

```bash
git clone <your-repo-url>
cd temptalk-G2
npm install
```

### 2. Configure Firebase

Copy the example env file and fill in your Firebase project credentials:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note:** Storage Bucket is included in the config for Firebase SDK initialisation, but TempTalk does **not** use Firebase Storage. Media lives entirely in Cloudinary.

### 3. Configure Cloudinary

Voice notes, images, and files are uploaded directly from the browser to Cloudinary using an **unsigned upload preset** (TempTalk has no server to sign requests).

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Copy your **Cloud Name** from the Dashboard.
3. Go to **Settings → Upload → Upload presets → Add upload preset**.
   - Set **Signing Mode** to **Unsigned**.
   - (Optional) Restrict allowed formats / max file size here for extra safety, since there's no server-side validation.
4. Add both values to `.env`:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

### 4. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

### 5. Run locally

```bash
npm run dev
```

App will be available at `http://localhost:5173`.

### 6. Build for production

```bash
npm run build
npm run preview
```

---

## How media sharing works

1. **Voice notes** — `useVoiceRecorder` wraps the browser `MediaRecorder` API. Tapping the mic button requests microphone access, records to an in-memory `Blob` (webm/opus where supported), and shows a live timer. Stopping uploads the blob to Cloudinary's `video` resource endpoint (Cloudinary has no separate "audio" type) and the returned URL is written to the message document.
2. **Images** — the image picker opens the native file dialog filtered to `image/*`. The selected file uploads to Cloudinary's `image` endpoint; the secure URL, file name, size, and MIME type are stored on the message and rendered as an inline `<img>` preview.
3. **Files** — the paperclip picker accepts PDFs, Office docs, text, and archives. Files upload to Cloudinary's `raw` endpoint (used for any non-image/video asset) and render as a download card showing file name, extension, and size.

In every case, **Firestore only ever stores a URL and metadata** — never the binary itself — keeping the app backend-free and Firestore documents small.

---

## Firestore Schema

### `rooms/{roomId}`

```ts
{
  name:         string       // Room display name
  passwordHash: string       // Simple hash of the password
  ownerId:      string       // userId of the creator
  ownerName:    string       // displayName of the creator
  createdAt:    Timestamp
  expiresAt:    Timestamp    // createdAt + 1 hour
  isActive:     boolean      // false when closed/expired
}
```

### `messages/{messageId}`

```ts
{
  roomId:     string
  senderId:   string
  senderName: string
  type:       'text' | 'image' | 'file' | 'audio'
  content:    string         // text body, or optional caption for media
  timestamp:  Timestamp

  // Present only when type is 'image' | 'file' | 'audio':
  fileUrl?:   string         // Cloudinary secure URL
  fileName?:  string         // original file name (or generated name for voice notes)
  fileSize?:  number         // bytes
  mimeType?:  string         // e.g. 'image/png', 'application/pdf'
  duration?:  number         // seconds — set for 'audio' messages only
}
```

### `activeUsers/{roomId_userId}`

```ts
{
  userId:      string
  displayName: string
  roomId:      string
  lastSeen:    Timestamp  // Updated via heartbeat every 20s
}
```

### `typing/{roomId_userId}`

```ts
{
  userId:      string
  displayName: string
  roomId:      string
  timestamp:   Timestamp  // Cleared after 3s of inactivity
}
```

---

## Project Structure

```
temptalk-G2/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── MessageBubble.tsx     # Renders text / image / audio / file bubbles
│   │   │   ├── MessageInput.tsx      # Text input + mic / image / file controls
│   │   │   ├── RoomHeader.tsx        # Header with timer, user count, menu
│   │   │   ├── TypingIndicator.tsx   # Animated typing dots
│   │   │   └── UserList.tsx          # Sidebar with online members
│   │   └── ui/
│   │       ├── Avatar.tsx            # Coloured initials avatar
│   │       ├── LoadingSpinner.tsx    # Spinner + full-page loader
│   │       └── Modal.tsx             # Accessible modal dialog
│   ├── contexts/
│   │   └── UserContext.tsx           # Session (userId + displayName)
│   ├── firebase/
│   │   └── config.ts                 # Firestore initialisation
│   ├── hooks/
│   │   ├── useCountdown.ts           # Live expiry countdown
│   │   ├── usePresence.ts            # Join/leave/heartbeat/typing
│   │   └── useVoiceRecorder.ts       # MediaRecorder wrapper for voice notes
│   ├── pages/
│   │   ├── ChatRoomPage.tsx          # Main chat view
│   │   ├── HomePage.tsx              # Create / Join landing
│   │   └── NotFoundPage.tsx          # 404
│   ├── services/
│   │   ├── cloudinaryService.ts      # Unsigned uploads: image / audio / raw file
│   │   ├── messageService.ts         # CRUD + realtime for messages (all 4 types)
│   │   ├── presenceService.ts        # Presence + typing Firestore ops
│   │   └── roomService.ts            # CRUD + realtime for rooms
│   ├── styles/
│   │   └── globals.css               # Tailwind base + component classes
│   ├── types/
│   │   └── index.ts                  # All TypeScript interfaces + MessageType enum
│   ├── utils/
│   │   └── helpers.ts                # Pure utility functions (incl. file/media helpers)
│   ├── vite-env.d.ts                 # Typed import.meta.env
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── favicon.svg
├── firestore.rules
├── .env.example
└── package.json
```

---

## Firestore Index Requirements

TempTalk is designed to **avoid composite indexes**.

- Messages are fetched with a single `where('roomId', '==', roomId)` and sorted **client-side**.
- Presence and typing docs use a compound document ID (`${roomId}_${userId}`) so lookups are direct reads.

No additional indexes need to be created in the Firebase console.

---

## Security Notes

- Passwords are hashed client-side using a simple 32-bit integer hash. This is suitable for temporary, low-stakes rooms. For production use, move password validation to a Firebase Cloud Function using bcrypt.
- All Firestore rules are permissive by design — this is a demo/portfolio application.
- Uploads use an **unsigned** Cloudinary preset, which is required for a backend-free app but means anyone with the cloud name + preset name could technically upload. Mitigate this in the Cloudinary preset settings: cap file size, restrict allowed formats, and enable moderation/auto-tagging if needed.
- No personal data is stored. Sessions live only in `localStorage`; Firestore documents auto-purge on room close. Cloudinary assets are **not** automatically deleted when a room closes — for a production deployment, consider a scheduled Cloudinary cleanup job keyed off message `fileUrl`s, or set an automatic expiration/TTL on the upload preset.

---
## 👨‍💻 Developer

**Gopinath R**

Final Year B.Sc Computer Science Student

TempTalk is a modern real-time temporary chat platform built to demonstrate production-level frontend development using React, TypeScript, Firebase Firestore, Cloudinary, and Tailwind CSS.

### Technologies Used

* React 18
* TypeScript
* Firebase Firestore
* Cloudinary
* Tailwind CSS
* Vite

### Project Highlights

* Real-time messaging
* Voice notes
* Image & file sharing
* Online presence
* Typing indicators
* Room expiry system
* Mobile-first responsive design

Designed and developed by Gopinath R as a portfolio project showcasing modern frontend engineering and real-time application development.

---
## License

MIT
