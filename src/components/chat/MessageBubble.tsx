import { useState } from 'react'
import { Download, FileText, AlertCircle, Play, Pause } from 'lucide-react'
import { Message, MessageType } from '../../types'
import { Avatar } from '../ui/Avatar'
import { formatMessageTime, formatFileSize, formatDuration, getFileExtension } from '../../utils/helpers'

interface MessageBubbleProps {
  message: Message
  isSelf: boolean
  showAvatar: boolean
}

export function MessageBubble({ message, isSelf, showAvatar }: MessageBubbleProps) {
  return (
    <div className={`flex items-end gap-2 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar slot — always takes space to keep alignment consistent */}
      <div className="w-7 flex-shrink-0">
        {!isSelf && showAvatar && (
          <Avatar name={message.senderName} userId={message.senderId} size="sm" />
        )}
      </div>

      <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isSelf ? 'items-end' : 'items-start'}`}>
        {/* Sender name — only for others, only on first message in group */}
        {!isSelf && showAvatar && (
          <span className="text-[11px] font-semibold text-surface-400 mb-1 px-1 tracking-wide">
            {message.senderName}
          </span>
        )}

        <MessageContent message={message} isSelf={isSelf} />

        {/* Timestamp */}
        <span className="text-[10px] text-surface-600 mt-1 px-1">
          {formatMessageTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}

function MessageContent({ message, isSelf }: { message: Message; isSelf: boolean }) {
  switch (message.type) {
    case MessageType.IMAGE:
      return <ImageBubble message={message} isSelf={isSelf} />
    case MessageType.AUDIO:
      return <AudioBubble message={message} isSelf={isSelf} />
    case MessageType.FILE:
      return <FileBubble message={message} isSelf={isSelf} />
    case MessageType.TEXT:
    default:
      return (
        <div className={isSelf ? 'bubble-self' : 'bubble-other'}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      )
  }
}

// ─── Image ───────────────────────────────────────────────────────────────────

function ImageBubble({ message, isSelf }: { message: Message; isSelf: boolean }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={`${isSelf ? 'bubble-self' : 'bubble-other'} !p-1.5`}>
      {failed || !message.fileUrl ? (
        <div className="flex items-center gap-2 px-2 py-3 text-xs text-surface-300">
          <AlertCircle size={15} />
          Image failed to load
        </div>
      ) : (
        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={message.fileUrl}
            alt={message.fileName ?? 'Shared image'}
            onError={() => setFailed(true)}
            className="rounded-xl max-w-full max-h-72 object-cover"
            loading="lazy"
          />
        </a>
      )}
      {message.content && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap px-1.5 pt-1.5">{message.content}</p>
      )}
    </div>
  )
}

// ─── Audio (voice note) ────────────────────────────────────────────────────

function AudioBubble({ message, isSelf }: { message: Message; isSelf: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioId = `audio-${message.id}`
  const [progress, setProgress] = useState(0) 

  const togglePlay = async () => {
  const el = document.getElementById(audioId) as HTMLAudioElement | null

  console.log("Audio URL:", message.fileUrl)

  if (!el) {
    console.error("Audio element not found")
    return
  }

  try {
    if (el.paused) {
      await el.play()
    } else {
      el.pause()
    }
  } catch (err) {
    console.error("PLAY ERROR:", err)
  }
}

  return (
    <div className={`${isSelf ? 'bubble-self' : 'bubble-other'} flex items-center gap-3 min-w-[200px]`}>
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center flex-shrink-0 transition-colors"
        aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
      </button>

      <div className="flex-1 min-w-0">
        <audio
  id={audioId}
  src={message.fileUrl}
  preload="metadata"
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
  onEnded={() => {
    setIsPlaying(false)
    setProgress(0)
  }}
  onTimeUpdate={(e) => {
    const audio = e.currentTarget
    if (audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100)
    }
  }}
  className="hidden"
/>
        <div className="h-1 rounded-full bg-white/20 overflow-hidden">
  <div
    className="h-full bg-white/80 transition-all"
    style={{ width: `${progress}%` }}
  />
</div>
        <div className="flex items-center justify-between mt-1 text-[11px] opacity-80">
  <span>
    {message.duration ? formatDuration(message.duration) : '0:00'}
  </span>

  <span>
    {formatMessageTime(message.timestamp)}
  </span>
</div>
      </div>
    </div>
  )
}

// ─── File ────────────────────────────────────────────────────────────────────

function FileBubble({ message, isSelf }: { message: Message; isSelf: boolean }) {
  const ext = message.fileName ? getFileExtension(message.fileName) : 'FILE'

  return (
    <a
      href={message.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={message.fileName}
      className={`${isSelf ? 'bubble-self' : 'bubble-other'} flex items-center gap-3 min-w-[220px] !no-underline hover:opacity-90 transition-opacity`}
    >
      <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
        <FileText size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{message.fileName ?? 'File'}</p>
        <p className="text-[11px] opacity-75 mt-0.5">
          {ext}
          {message.fileSize ? ` · ${formatFileSize(message.fileSize)}` : ''}
        </p>
      </div>

      <Download size={16} className="flex-shrink-0 opacity-80" />
    </a>
  )
}
