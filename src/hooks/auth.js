import { create } from 'zustand'

export const useUserProfile = create((set) => ({
    userProfile: {},
    refresh: false,
    setUserProfile: (userProfile) => set({ userProfile }),
    setRefresh: () => set((state) => ({ refresh: !state.refresh })),
}))
