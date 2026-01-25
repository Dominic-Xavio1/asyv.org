'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ImageIcon, FileText, Film, Mic, X, Send,Music, Smile, Square,Disc, Play, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';

/**
 * GroupMessageInput Component
 * 
 * Handles file uploads and message input for group chats
 * Supports: text, images, videos, audio, documents, voice notes
 */
export default function GroupMessageInput({
  messageInput,
  setMessageInput,
  onSendMessage,
  disabled = false,
  isDark = false,
  inputBg = "bg-gray-50",
  borderColor = "border-gray-200",
  textColor = "text-gray-900",
  textMuted = "text-gray-600",
  showEmoji,
  setShowEmoji,
  onEmojiSelect,
  socket,
  currentUserId,
  selectedChat,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image', 'video', 'audio', 'document'
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const documentInputRef = useRef(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voicePreview, setVoicePreview] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Typing indicator hook
  const { handleInputChange, stopTyping } = useTypingIndicator(
    socket,
    currentUserId,
    selectedChat,
    null // onTypingStateChange callback not needed here
  );

  const handleFileSelect = (file, type) => {
    if (!file) return;
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Clear voice recording if file is selected
    if (voicePreview) {
      setVoicePreview(null);
    }

    setSelectedFile(file);
    setFileType(type);

    // Create preview for images and videos
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else if (type === 'video') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileClick = (type) => {
    const inputMap = {
      image: imageInputRef,
      video: videoInputRef,
      audio: audioInputRef,
      document: documentInputRef,
    };
    inputMap[type]?.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    // Reset all file inputs
    [imageInputRef, videoInputRef, audioInputRef, documentInputRef].forEach(ref => {
      if (ref.current) ref.current.value = '';
    });
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
        
        // Create preview URL
        const audioUrl = URL.createObjectURL(audioBlob);
        setVoicePreview({ url: audioUrl, duration: recordingTime });
        
        // Set as selected file
        setSelectedFile(audioFile);
        setFileType('audio');
        setFilePreview(null);
        setIsRecording(false);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      // Timer for recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Microphone access denied');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const clearVoiceRecording = () => {
    setVoicePreview(null);
    setSelectedFile(null);
    setFileType(null);
    setRecordingTime(0);
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    if (!messageInput.trim() && !selectedFile) {
      toast.error('Please enter a message or select a file');
      return;
    }

    // Stop typing indicator when sending
    if (socket && currentUserId && selectedChat) {
      stopTyping();
    }

    onSendMessage({
      text: messageInput.trim(),
      file: selectedFile,
      fileType: fileType,
    });

    // Clear after send
    setMessageInput('');
    handleRemoveFile();
    clearVoiceRecording();
  };

  return (
    <div className="space-y-2">
      {/* File/Voice Preview */}
      {selectedFile && (
        <div className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg border ${borderColor} relative`}>
          <button
            onClick={handleRemoveFile}
            className={`absolute top-2 right-2 p-1 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-200'} transition-colors`}
          >
            <X className="h-4 w-4" />
          </button>
          
          {filePreview && (fileType === 'image' || fileType === 'video') ? (
            <div className="mt-2">
              {fileType === 'image' ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="max-w-xs max-h-48 rounded object-cover"
                />
              ) : (
                <video
                  src={filePreview}
                  controls
                  className="max-w-xs max-h-48 rounded"
                />
              )}
              <p className={`text-xs ${textMuted} mt-2`}>
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          ) : fileType === 'audio' && voicePreview ? (
            <div className={`p-3 ${isDark ? 'bg-gray-700' : 'bg-white'} rounded-lg border ${borderColor}`}>
              <p className={`text-sm font-medium ${textColor} mb-2`}>Voice Note</p>
              <audio 
                src={voicePreview.url} 
                controls 
                className="w-full mb-2"
              />
              <p className={`text-xs ${textMuted}`}>
                Duration: {voicePreview.duration}s
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <FileText className="h-8 w-8 text-gray-400" />
              <div>
                <p className={`text-sm ${textColor} font-medium`}>{selectedFile.name}</p>
                <p className={`text-xs ${textMuted}`}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {fileType}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recording Status */}
      {isRecording && (
        <div className={`p-3 ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-100 border-red-300'} rounded-lg border flex items-center gap-2`}>
          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          <span className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
            Recording... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files[0], 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files[0], 'video')}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files[0], 'audio')}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files[0], 'document')}
      />

      {/* Input Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => handleFileClick('image')}
          disabled={disabled || isRecording}
          className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
          title="Attach image"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => handleFileClick('document')}
          disabled={disabled || isRecording}
          className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
          title="Attach document"
        >
          <FileText className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => handleFileClick('video')}
          disabled={disabled || isRecording}
          className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
          title="Attach video"
        >
          <Film className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => handleFileClick('audio')}
          disabled={disabled || isRecording}
          className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
          title="Attach audio file"
        >
          <Music className="h-5 w-5" />
        </Button>

        {/* Voice Recording Button */}
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={`${isRecording ? (isDark ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 hover:bg-red-200') : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}`}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          {isRecording ? (
            <Square className="h-5 w-5 text-red-500" />
          ) : (
            <Disc className="h-5 w-5" />
          )}
        </Button>

        <div className="flex-1 relative">
          <textarea
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              // Auto-expand textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              // Trigger typing indicator
              if (socket && currentUserId && selectedChat) {
                handleInputChange();
              }
            }}
            placeholder="Type a message..."
            className={`w-full px-4 py-2 pr-10 rounded-lg border resize-none focus:outline-none focus:ring-1 focus:ring-green-500 max-h-[120px] overflow-y-auto ${inputBg} ${borderColor} ${textColor} placeholder:${textMuted}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && (messageInput.trim() || selectedFile)) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={disabled || isRecording}
            rows={1}
          />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`absolute right-1 top-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Add emoji"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        <Button
          size="icon"
          type="button"
          onClick={handleSend}
          disabled={disabled || isRecording || (!messageInput.trim() && !selectedFile)}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
