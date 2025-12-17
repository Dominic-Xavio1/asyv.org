import {create} from 'zustand';

export const useUserStore = create((set) => ({
  currentUser: null,
  setCurrentUser: (userData) => set({currentUser: userData}),
  clearUser: () => set({currentUser: null}),
}));

export const chatDarkModeStore = create((set)=>({
  visible:false,
  setVisible: () => set((state)=>({visible: !state.visible})),
  clearVisible: () => set({visible: false}),
}))