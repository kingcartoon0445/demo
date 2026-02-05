import { create } from "zustand";

export const useHistoryStore = create((set) => ({
    historyList: [],
    page: 0,
    incPage: () => set((state: any) => ({ page: state.page + 1 })),
    resetPage: () => set({ page: 0 }),
    refreshList: false,
    setRefreshList: () =>
        set((state: any) => ({ refreshList: !state.refreshList })),
    refresh: false,
    setRefresh: () => set((state: any) => ({ refresh: !state.refresh })),
    addHistory: undefined,
    setAddHistory: (addHistory: any) => set({ addHistory }),
    updateData: undefined,
    setUpdateData: (updateData: any) => set({ updateData }),
    updateHistoryList: (historyList: any) => set({ historyList }),
    setHistoryList: (newState: any) =>
        set(
            (oldState: any) =>
                ({
                    historyList: [...oldState.historyList, ...newState],
                } as any)
        ),
    resetHistoryList: () => set({ historyList: [] }),
}));

export const useDetailPaymentStore = create((set) => ({
    open: false,
    transactionId: null,
    setOpen: (open: any) => set({ open }),
    setTransactionId: (transactionId: any) => set({ transactionId }),
}));
