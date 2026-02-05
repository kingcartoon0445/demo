// store/customerStore.ts
import { create } from "zustand";

type LeadState = {
    selectedLead: any | null;
    isArchiveMode: boolean;
    setSelectedLead: (lead: any | null) => void;
    toggleArchiveMode: () => void;
    reset: () => void;
};

export const useLeadStore = create<LeadState>((set) => ({
    selectedLead: null,
    isArchiveMode: false,

    setSelectedLead: (lead) => set({ selectedLead: lead }),

    toggleArchiveMode: () =>
        set((state) => ({
            selectedLead: null,
            isArchiveMode: !state.isArchiveMode,
        })),

    reset: () => set({ selectedLead: null, isArchiveMode: false }),
}));
