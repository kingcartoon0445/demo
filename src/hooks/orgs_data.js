import { create } from "zustand";

export const useOrgList = create((set) => ({
  orgList: [],
  refreshOrgList: false,
  setRefreshOrgList: () =>
    set((state) => ({ refreshOrgList: !state.refreshOrgList })),
  setOrgList: (orgList) => set({ orgList }),
}));
export const useCurrentOrg = create((set) => ({
  currentOrg: undefined,
  setCurrentOrg: (currentOrg) => set({ currentOrg }),
}));
