import { useCallback, useRef, useState, KeyboardEvent, ChangeEvent } from 'react'
import { Send, Mic, Image as ImageIcon, Paperclip, X, Square } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { formatDuration } from '../../utils/helpers'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB
const ACCEPTED_FILE_TYPES =
  '.pdf,.doc,.docx,.txt,.zip,.rar,.7z,.csv,.xlsx,.xls,.ppt,.pptx,.json,.md'

interface MessageInputProps {
  onSendText: (text: string) => Promise<void>
  onSendImage: (file: File) => Promise<void>
  onSendFile: (file: File) => Promise<void>
  onSendAudio: (blob: Blob, durationSeconds: number) => Promise<void>
  onTyping: () => void
  disabled?: boolean
}

export function MessageInput({
  onSendText,
  onSendImage,
  onSendFile,
  onSendAudio,
  onTyping,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { isRecording, recordingSeconds, error: recordError, startRecording, stopRecording, cancelRecording } =
    useVoiceRecorder()

  const busy = sending || uploadingLabel !== null || disabled

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  // ── Text ────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    setSending(true)
    try {
      await onSendText(trimmed)
      setText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }, [text, busy, onSendText])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Image ───────────────────────────────────────────────────────────────

  const handleImageSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || busy) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be smaller than 10 MB.')
      return
    }

    setUploadingLabel('Uploading image…')
    try {
      await onSendImage(file)
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploadingLabel(null)
    }
  }

  // ── File ────────────────────────────────────────────────────────────────

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || busy) return

    if (file.size > MAX_FILE_BYTES) {
      toast.error('File must be smaller than 25 MB.')
      return
    }

    setUploadingLabel('Uploading file…')
    try {
      await onSendFile(file)
    } catch {
      toast.error('Failed to upload file')
    } finally {
      setUploadingLabel(null)
    }
  }

  // ── Voice note ──────────────────────────────────────────────────────────

  const handleMicClick = async () => {
    if (busy) return
    await startRecording()
    if (recordError) toast.error(recordError)
  }

  const handleStopAndSend = async () => {
    const blob = await stopRecording()
    if (!blob) {
      toast.error('No audio captured.')
      return
    }
    setUploadingLabel('Uploading voice note…')
    try {
      await onSendAudio(blob, recordingSeconds)
    } catch {
      toast.error('Failed to upload voice note')
    } finally {
      setUploadingLabel(null)
    }
  }

  const canSend = text.trim().length > 0 && !busy

  // ── Render: recording state ────────────────────────────────────────────

  if (isRecording) {
    return (
      <div className="px-3 py-3 border-t border-surface-800 bg-surface-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 bg-surface-800 rounded-2xl px-4 py-2.5 border border-red-500/40">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 animate-ping opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-sm text-surface-200 font-medium flex-1">
            Recording… {formatDuration(recordingSeconds)}
          </span>
          <button
            onClick={cancelRecording}
            className="btn-ghost p-2 rounded-xl text-surface-400 hover:text-red-400"
            aria-label="Cancel recording"
          >
            <X size={17} />
          </button>
          <button
            onClick={handleStopAndSend}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-500 hover:bg-primary-400 text-white shadow-md transition-all duration-150 active:scale-90"
            aria-label="Stop and send recording"
          >
            <Square size={14} />
          </button>
        </div>
      </div>
    )
  }

  // ── Render: normal state ───────────────────────────────────────────────

  return (
    <div className="px-3 py-3 border-t border-surface-800 bg-surface-900/80 backdrop-blur-sm">
      <div className="flex items-end gap-2 bg-surface-800 rounded-2xl px-3 py-2 border border-surface-700 focus-within:border-primary-500/60 transition-colors duration-150">
        {/* Image picker */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={busy}
          className="flex-shrink-0 mb-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-primary-400 hover:bg-surface-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send an image"
          title="Send an image"
        >
          <ImageIcon size={18} />
        </button>

        {/* File picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          onChange={handleFileSelected}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="flex-shrink-0 mb-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-primary-400 hover:bg-surface-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send a file"
          title="Send a file"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => {
            setText(e.target.value)
            onTyping()
            autoResize()
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled ? 'Room is closed' : uploadingLabel ? uploadingLabel : 'Message…'
          }
          className="flex-1 bg-transparent text-surface-100 placeholder-surface-600 text-sm leading-relaxed resize-none outline-none py-1 min-h-[36px] max-h-32"
          rows={1}
          disabled={busy}
        />

        {/* Mic button — shown when there's no text to send */}
        {!canSend && (
          <button
            onClick={handleMicClick}
            disabled={busy}
            className="flex-shrink-0 mb-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-primary-400 hover:bg-surface-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Record a voice note"
            title="Record a voice note"
          >
            <Mic size={18} />
          </button>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            flex-shrink-0 mb-0.5 w-9 h-9 rounded-xl flex items-center justify-center
            transition-all duration-150 active:scale-90
            ${canSend
              ? 'bg-primary-500 hover:bg-primary-400 text-white shadow-md'
              : 'bg-surface-700 text-surface-500 cursor-not-allowed'
            }
          `}
          aria-label="Send message"
        >
          {sending || uploadingLabel ? <LoadingSpinner size="sm" /> : <Send size={16} />}
        </button>
      </div>

      <p className="text-[10px] text-surface-700 text-center mt-1.5">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
