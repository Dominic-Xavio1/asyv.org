'use client';
import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for managing typing indicators in chat
 * Handles typing detection, debouncing, and socket event emission
 * 
 * @param {Object} socket - Socket.io instance
 * @param {string} currentUserId - Current user's ID
 * @param {Object} selectedChat - Currently selected chat (private or group)
 * @param {Function} onTypingStateChange - Callback when typing state changes
 * @returns {Object} - Typing indicator utilities
 */
export function useTypingIndicator(socket, currentUserId, selectedChat, onTypingStateChange) {
  const typingTimeoutRef = useRef(null);
  const lastTypingEmitRef = useRef(0);
  const isTypingRef = useRef(false);
  
  // Debounce delay for typing events (milliseconds)
  const TYPING_DEBOUNCE_DELAY = 300; // Emit typing event every 300ms max
  const TYPING_STOP_DELAY = 2000; // Stop typing after 2 seconds of inactivity

  /**
   * Emit typing started event
   */
  const emitTypingStarted = useCallback(() => {
    if (!socket || !socket.connected || !currentUserId || !selectedChat?.id) {
      return;
    }

    const now = Date.now();
    // Throttle typing events to avoid spamming
    if (now - lastTypingEmitRef.current < TYPING_DEBOUNCE_DELAY) {
      return;
    }

    lastTypingEmitRef.current = now;
    const isGroupChat = selectedChat.isGroup || selectedChat.type === 'group';

    if (isGroupChat) {
      socket.emit('group_typing_started', {
        groupId: String(selectedChat.id),
        userId: String(currentUserId),
        isTyping: true,
      });
    } else {
      socket.emit('private_typing_started', {
        conversationId: String(selectedChat.id),
        userId: String(currentUserId),
        isTyping: true,
      });
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStateChange?.(true);
    }
  }, [socket, currentUserId, selectedChat, onTypingStateChange]);

  /**
   * Emit typing stopped event
   */
  const emitTypingStopped = useCallback(() => {
    if (!socket || !socket.connected || !currentUserId || !selectedChat?.id) {
      return;
    }

    if (!isTypingRef.current) {
      return;
    }

    isTypingRef.current = false;
    const isGroupChat = selectedChat.isGroup || selectedChat.type === 'group';

    if (isGroupChat) {
      socket.emit('group_typing_stopped', {
        groupId: String(selectedChat.id),
        userId: String(currentUserId),
        isTyping: false,
      });
    } else {
      socket.emit('private_typing_stopped', {
        conversationId: String(selectedChat.id),
        userId: String(currentUserId),
        isTyping: false,
      });
    }

    onTypingStateChange?.(false);
  }, [socket, currentUserId, selectedChat, onTypingStateChange]);

  /**
   * Handle input change - detects typing and manages debouncing
   */
  const handleInputChange = useCallback(() => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing started
    emitTypingStarted();

    // Set timeout to stop typing after inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStopped();
    }, TYPING_STOP_DELAY);
  }, [emitTypingStarted, emitTypingStopped]);

  /**
   * Stop typing immediately (e.g., when message is sent)
   */
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    emitTypingStopped();
  }, [emitTypingStopped]);

  /**
   * Cleanup on unmount or chat change
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing when component unmounts or chat changes
      if (isTypingRef.current) {
        emitTypingStopped();
      }
    };
  }, [selectedChat?.id, emitTypingStopped]);

  return {
    handleInputChange,
    stopTyping,
  };
}
