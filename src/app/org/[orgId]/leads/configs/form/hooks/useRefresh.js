import { create } from "zustand";

export const useRefresh = create((set) => ({
    refreshConnectionsList: false,
    setRefreshConnectionsList: () =>
        set((state) => ({ refreshConnectionsList: !state.refreshConnectionsList })),
}));
