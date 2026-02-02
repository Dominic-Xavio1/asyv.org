/**
 * Message Store for managing unread message counts and chat state
 */

import { create } from 'zustand';

export const useMessageStore = create((set, get) => ({
  // Unread message counts by conversation ID
  unreadCounts: {},
  
  // Total unread messages across all conversations
  totalUnreadCount: 0,
  
  // Last message in each conversation
  lastMessages: {},
  
  // Update unread count for a specific conversation
  updateUnreadCount: (conversationId, count) => {
    set((state) => {
      const newUnreadCounts = {
        ...state.unreadCounts,
        [conversationId]: count,
      };
      
      // Calculate total unread count
      const totalUnreadCount = Object.values(newUnreadCounts).reduce(
        (total, count) => total + count, 
        0
      );
      
      return {
        unreadCounts: newUnreadCounts,
        totalUnreadCount,
      };
    });
  },
  
  // Increment unread count for a conversation
  incrementUnreadCount: (conversationId) => {
    const currentCount = get().unreadCounts[conversationId] || 0;
    get().updateUnreadCount(conversationId, currentCount + 1);
  },
  
  // Mark conversation as read (reset unread count to 0)
  markAsRead: (conversationId) => {
    get().updateUnreadCount(conversationId, 0);
  },
  
  // Update last message for a conversation
  updateLastMessage: (conversationId, message) => {
    set((state) => ({
      lastMessages: {
        ...state.lastMessages,
        [conversationId]: message,
      },
    }));
  },
  
  // Get unread count for a specific conversation
  getUnreadCount: (conversationId) => {
    return get().unreadCounts[conversationId] || 0;
  },
  
  // Reset all unread counts
  resetAllUnreadCounts: () => {
    set({
      unreadCounts: {},
      totalUnreadCount: 0,
    });
  },
  
  // Initialize unread counts from server data
  initializeUnreadCounts: (counts) => {
    const totalUnreadCount = Object.values(counts).reduce(
      (total, count) => total + count, 
      0
    );
    
    set({
      unreadCounts: counts,
      totalUnreadCount,
    });
  },
}));

export default useMessageStore;
