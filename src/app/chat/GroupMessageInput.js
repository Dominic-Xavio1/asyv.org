
"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Send,
  Smile,
  ImageIcon,
  Mic,
  FileText,
  Paperclip,
  Music,
  X,
  Square,
  Loader2,
} from "lucide-react"
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder"
import toast from "react-hot-toast"
import { detectChatFileType, FILE_TOO_HEAVY_MESSAGE, isFileTooHeavy } from "@/lib/chatMedia"

// ─── Format seconds as M:SS ───
function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

// ─── Voice recording bar (shown above input when recording or after stop) ───
function VoiceRecordingBar({
  status,
  error,
  durationSec,
  recordedFile,
  isDark,
  onStopRecording,
  onUseRecording,
  onCancel,
}) {
  if (status === "idle" && !error) return null

  const isError = status === "error"
  const isRequesting = status === "requesting"
  const isRecording = status === "recording"
  const isStopped = status === "stopped"

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 mb-2 rounded-xl border
        ${isError
          ? isDark ? "bg-red-900/20 border-red-800 text-red-200" : "bg-red-50 border-red-200 text-red-800"
          : isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
        }
      `}
    >
      {isError && (
        <>
          <span className="text-sm flex-1">{error}</span>
          <button
            type="button"
            onClick={onCancel}
            className="flex-shrink-0 p-1.5 rounded-lg opacity-80 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}

      {isRequesting && (
        <>
          <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-green-500" />
          <span className="text-sm">Requesting microphone…</span>
        </>
      )}

      {isRecording && (
        <>
          <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" aria-hidden />
          <span className="text-sm font-medium tabular-nums">{formatDuration(durationSec)}</span>
          <span className="text-xs opacity-80 flex-1">Recording…</span>
          <button
            type="button"
            onClick={onStopRecording}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
            aria-label="Stop recording"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-shrink-0 p-1.5 rounded-lg opacity-70 hover:opacity-100"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}

      {isStopped && recordedFile && (
        <>
          <Mic className="w-4 h-4 flex-shrink-0 text-green-500" />
          <span className="text-sm flex-1 truncate">Voice note ({formatDuration(durationSec)})</span>
          <button
            type="button"
            onClick={onUseRecording}
            className="flex-shrink-0 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            Use
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-shrink-0 p-1.5 rounded-lg opacity-70 hover:opacity-100"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  )
}

// ─── Media picker dropdown (replaces the 4 cramped icon buttons on mobile) ───
function MediaPickerButton({ onFileSelect, onVoiceNoteClick, isDark }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const options = [
    {
      icon: ImageIcon,
      label: "Photo / Video",
      accept: "image/*,video/*",
      type: "image",
      isVoiceNote: false,
    },
    {
      icon: Music,
      label: "Audio file",
      accept: "audio/*",
      type: "audio",
      isVoiceNote: false,
    },
    {
      icon: Mic,
      label: "Voice note",
      accept: "audio/*",
      type: "audio",
      isVoiceNote: true,
    },
    {
      icon: FileText,
      label: "Document",
      accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt",
      type: "document",
      isVoiceNote: false,
    },
  ]

  const triggerFileInput = (accept, type) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = accept
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (file) {
        if (isFileTooHeavy(file)) {
          toast.error(FILE_TOO_HEAVY_MESSAGE)
          setOpen(false)
          return
        }
        onFileSelect(file, type)
      }
      setOpen(false)
    }
    input.click()
  }

  const handleOptionClick = (opt) => {
    if (opt.isVoiceNote && onVoiceNoteClick) {
      setOpen(false)
      onVoiceNoteClick()
      return
    }
    triggerFileInput(opt.accept, opt.type)
  }

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Attach media"
        className={`
          flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200
          ${open
            ? isDark
              ? "bg-gray-600 text-white"
              : "bg-gray-200 text-gray-800"
            : isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800"
          }
        `}
      >
        {open
          ? <X className="w-4 h-4" />
          : <Paperclip className="w-4 h-4" />
        }
      </button>

      {open && (
        <div
          className={`
            absolute bottom-full left-0 mb-2 z-50 rounded-2xl overflow-hidden
            border shadow-2xl
            ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
          `}
          style={{
            animation: "mediaPickerIn 0.2s cubic-bezier(0.22,1,0.36,1) both",
            minWidth: 176,
          }}
        >
          <style>{`
            @keyframes mediaPickerIn {
              from { opacity: 0; transform: translateY(6px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)   scale(1); }
            }
          `}</style>

          {options.map((opt) => {
            const { icon: Icon, label } = opt
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleOptionClick(opt)}
                className={`
                  flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium
                  transition-colors duration-150
                  ${isDark
                    ? "text-gray-200 hover:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-green-500" />
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main GroupMessageInput ───────────────────────────────────────────────────
export default function GroupMessageInput({
  messageInput,
  setMessageInput,
  onSendMessage,
  disabled,
  isDark,
  inputBg,
  borderColor,
  textColor,
  textMuted,
  showEmoji,
  setShowEmoji,
  replyToMessage,
  onClearReply,
  onEmojiSelect,
  socket,
  currentUserId,
  selectedChat,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedFileType, setSelectedFileType] = useState(null)
  const typingTimeoutRef = useRef(null)
  const focusInputRef = useRef(null)

  const {
    isSupported: isVoiceSupported,
    status: voiceStatus,
    error: voiceError,
    startRecording,
    stopRecording,
    reset: resetVoiceRecorder,
    durationSec: voiceDurationSec,
    recordedFile: voiceRecordedFile,
  } = useVoiceRecorder()

  useEffect(() => {
    if (focusInputRef.current) {
      focusInputRef.current.focus()
    }
  }, [])

  const handleVoiceNoteClick = () => {
    startRecording()
  }

  const handleUseVoiceRecording = () => {
    if (voiceRecordedFile) {
      if (isFileTooHeavy(voiceRecordedFile)) {
        toast.error(FILE_TOO_HEAVY_MESSAGE)
        resetVoiceRecorder()
        return
      }
      setSelectedFile(voiceRecordedFile)
      setSelectedFileType("audio")
    }
    resetVoiceRecorder()
  }

  const handleCancelVoiceRecording = () => {
    resetVoiceRecorder()
  }
  // ── Typing indicator emit ──────────────────────────────────────────────
  const emitTyping = (isTyping) => {
    if (!socket || !selectedChat?.id || !currentUserId) return
    const isGroup = selectedChat?.isGroup || selectedChat?.type === "group"
    // Use server-expected event names so start/stop are handled correctly
    if (isGroup) {
      if (isTyping) {
        socket.emit('group_typing_started', {
          groupId: String(selectedChat.id),
          userId: String(currentUserId),
          isTyping: true,
        })
      } else {
        socket.emit('group_typing_stopped', {
          groupId: String(selectedChat.id),
          userId: String(currentUserId),
          isTyping: false,
        })
      }
    } else {
      if (isTyping) {
        socket.emit('private_typing_started', {
          conversationId: String(selectedChat.id),
          userId: String(currentUserId),
          isTyping: true,
        })
      } else {
        socket.emit('private_typing_stopped', {
          conversationId: String(selectedChat.id),
          userId: String(currentUserId),
          isTyping: false,
        })
      }
    }
  }

  const handleInputChange = (e) => {
    setMessageInput(e.target.value)

    // Emit typing start
    emitTyping(true)

    // Clear previous timeout and set new one to stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false)
    }, 2000)
  }

  // ── File selected from picker ──────────────────────────────────────────
  const handleFileSelect = (file, type) => {
    if (isFileTooHeavy(file)) {
      toast.error(FILE_TOO_HEAVY_MESSAGE)
      return
    }
    setSelectedFile(file)
    setSelectedFileType(detectChatFileType(file, type))
  }

  // ── Send ───────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!messageInput.trim() && !selectedFile) return

    if (selectedFile && isFileTooHeavy(selectedFile)) {
      toast.error(FILE_TOO_HEAVY_MESSAGE)
      return
    }

    onSendMessage({
      text: messageInput,
      file: selectedFile,
      fileType: selectedFileType,
      replyTo: replyToMessage || null,
    })

    setMessageInput("")
    setSelectedFile(null)
    setSelectedFileType(null)
    if (onClearReply) onClearReply()

    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    emitTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── File preview badge ─────────────────────────────────────────────────
  const isVoiceNote =
    selectedFileType === "audio" &&
    selectedFile?.name?.toLowerCase().startsWith("voice-note")
  const FilePreview = () => {
    if (!selectedFile) return null
    return (
      <div className={`
        flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg text-xs font-medium
        ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}
      `}>
        {isVoiceNote ? (
          <Mic className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        )}
        <span className="truncate max-w-[180px]">
          {isVoiceNote ? "Voice note" : selectedFile.name}
        </span>
        <button
          type="button"
          onClick={() => { setSelectedFile(null); setSelectedFileType(null) }}
          className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div>
      {replyToMessage && (
        <div className={`
          flex items-start gap-2 px-3 py-2 mb-2 rounded-xl border
          ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"}
        `}>
          <div className={`w-1 self-stretch rounded-full ${isDark ? "bg-orange-400" : "bg-orange-500"}`} />
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-semibold ${isDark ? "text-orange-300" : "text-orange-600"}`}>
              Replying to {replyToMessage.senderName || "message"}
            </p>
            <p className={`text-xs truncate ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {replyToMessage.text}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearReply}
            className="flex-shrink-0 p-1 rounded-md opacity-70 hover:opacity-100"
            aria-label="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <VoiceRecordingBar
        status={voiceStatus}
        error={voiceError}
        durationSec={voiceDurationSec}
        recordedFile={voiceRecordedFile}
        isDark={isDark}
        onStopRecording={stopRecording}
        onUseRecording={handleUseVoiceRecording}
        onCancel={handleCancelVoiceRecording}
      />
      <FilePreview />

      {/*
        ┌───────────────────────────────────────────────────────┐
        │  [📎]  [text input grows to fill space]  [😊]  [▶]  │
        └───────────────────────────────────────────────────────┘
        Voice note: tap "Voice note" in picker → record in-app → Use → send.
      */}
      <div className="flex items-center gap-2">
        <MediaPickerButton
          onFileSelect={handleFileSelect}
          onVoiceNoteClick={handleVoiceNoteClick}
          isDark={isDark}
        />

        {/* ── Text input ── */}
        <Input
          placeholder="Type a message..."
          ref={focusInputRef}
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            flex-1 min-w-0 h-9 text-sm rounded-xl
            ${inputBg} ${borderColor} 
          `}
        />
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          title="Emoji"
          className={`
            flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl
            transition-colors duration-200
            ${showEmoji
              ? isDark ? "bg-gray-600 text-yellow-300" : "bg-yellow-50 text-yellow-500"
              : isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-yellow-300"
                       : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-yellow-500"
            }
          `}
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* ── Send button ── */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!messageInput.trim() && !selectedFile)}
          title="Send"
          className={`
            flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl
            transition-all duration-200
            ${(!messageInput.trim() && !selectedFile) || disabled
              ? isDark ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                       : "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-orange-400 hover:bg-orange-500 active:scale-95 text-white shadow-sm"
            }
          `}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
