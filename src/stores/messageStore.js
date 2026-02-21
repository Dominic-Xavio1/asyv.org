import { create } from 'zustand';

export const useMessageStore = create((set, get) => ({
  unreadCounts: {}, // Map of conversationId -> count
  totalUnreadCount: 0,

  // Set all unread counts (e.g., on initial load)
  setUnreadCounts: (counts) => {
    // counts is expected to be an object { conversationId: count }
    const total = Object.values(counts).reduce((acc, curr) => acc + curr, 0);
    set({ unreadCounts: counts, totalUnreadCount: total });
  },

  // Update a single conversation's count
  updateUnreadCount: (conversationId, count) => {
    const currentCounts = get().unreadCounts;
    const newCounts = { ...currentCounts, [conversationId]: count };
    const total = Object.values(newCounts).reduce((acc, curr) => acc + curr, 0);
    set({ unreadCounts: newCounts, totalUnreadCount: total });
  },

  // Increment unread count for a conversation
  incrementUnreadCount: (conversationId) => {
    const currentCounts = get().unreadCounts;
    const currentCount = currentCounts[conversationId] || 0;
    const newCount = currentCount + 1;
    const newCounts = { ...currentCounts, [conversationId]: newCount };
    const total = Object.values(newCounts).reduce((acc, curr) => acc + curr, 0);
    set({ unreadCounts: newCounts, totalUnreadCount: total });
  },

  // Mark all messages in a conversation as read
  markAsRead: (conversationId) => {
    const currentCounts = get().unreadCounts;
    const newCounts = { ...currentCounts, [conversationId]: 0 };
    const total = Object.values(newCounts).reduce((acc, curr) => acc + curr, 0);
    set({ unreadCounts: newCounts, totalUnreadCount: total });
  }
}));
