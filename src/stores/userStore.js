import {create} from 'zustand';

export const useUserStore = create((set) => ({
  currentUser: null,
  setCurrentUser: (userData) => set({currentUser: userData}),
  clearUser: () => set({currentUser: null}),
}));