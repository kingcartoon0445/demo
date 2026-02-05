import { create } from "zustand";

export const useWorkspaceList = create((set) => ({
  workspaceList: [],
  workspacesRefresh: false,
  setWorkspacesRefresh: () => set((state) => ({ workspacesRefresh: !state.workspacesRefresh })),
  setWorkspaceList: (workspaceList) => set({ workspaceList }),
}));
export const useCurrentWorkspace = create((set) => ({
  currentWorkspace: undefined,
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  workspaceRefresh: false,
  setWorkspaceRefresh: () => set((state) => ({ workspaceRefresh: !state.workspaceRefresh })),
}));
