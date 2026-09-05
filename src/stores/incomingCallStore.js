import { create } from "zustand"

export const useIncomingCallStore = create((set) => ({
  incomingCall: null,
  setIncomingCall: (payload) => set({ incomingCall: payload }),
  clearIncomingCall: () => set({ incomingCall: null }),
}))
