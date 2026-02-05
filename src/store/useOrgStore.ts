import { create } from "zustand";
import { getOrgDetail } from "@/api/org";

interface OrgState {
    orgDetail: any | null;
    isLoading: boolean;
    error: any;
    fetchOrgDetail: (orgId: string) => Promise<void>;
    reset: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
    orgDetail: null,
    isLoading: false,
    error: null,
    fetchOrgDetail: async (orgId: string) => {
        set({ isLoading: true, error: null });
        try {
            const res = await getOrgDetail(orgId);
            if (res && res.code === 0) {
                set({ orgDetail: res.content, isLoading: false });
            } else {
                set({ orgDetail: res, isLoading: false }); // Fallback if structure is different
            }
        } catch (error) {
            console.error(error);
            set({ error, isLoading: false });
        }
    },
    reset: () => set({ orgDetail: null, isLoading: false, error: null }),
}));
