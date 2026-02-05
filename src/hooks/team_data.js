import { create } from "zustand";

export const useTeamCreate = create((set) => ({
  openTeamCreate: false,
  parentId: "",
  setOpenTeamCreate: (openTeamCreate) => set({ openTeamCreate }),
  setParentId: (parentId) => set({ parentId }),
}));
export const useTeamList = create((set) => ({
  teamList: [],
  setTeamList: (teamList) => set({ teamList }),
}));
export const useTeamUpdate = create((set) => ({
  openTeamUpdate: false,
  openTeamRouteConfig: false,
  parentId: "",
  updateTeamData: undefined,
  setUpdateTeam: (updateTeamData) => set({ updateTeamData }),
  setOpenTeamUpdate: (openTeamUpdate) => set({ openTeamUpdate }),
  setOpenTeamRouteConfig: (openTeamRouteConfig) => set({ openTeamRouteConfig }),
  setParentId: (parentId) => set({ parentId }),
}));
export const useTeamListRefresh = create((set) => ({
  refreshList: false,
  setRefreshList: () => set((state) => ({ refreshList: !state.refreshList })),
}));

export const useTeamSelected = create((set) => ({
  selectedTeam: undefined,
  setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
}));
export const useDetailMemberList = create((set) => ({
  detailMemberList: undefined,
  refreshList: false,
  setRefreshList: () => set((state) => ({ refreshList: !state.refreshList })),
  setDetailMemberList: (detailMemberList) => set({ detailMemberList }),
  resetMemberList: () => set({ detailMemberList: undefined }),
}));

export const useAddMembersToTeamList = create((set) => ({
  openAddMembers: false,
  setOpenAddMembers: (openAddMembers) => set({ openAddMembers }),
  page: 0,
  searchText: "",
  incPage: () => set((state) => ({ page: state.page + 1 })),
  resetPage: () => set({ page: 0 }),
  memberList: [],
  setSearchText: (searchText) => set({ searchText }),
  setMemberList: (newState) =>
    set((oldState) => ({
      memberList: [...oldState.memberList, ...newState],
    })),
  resetMemberList: () => set({ memberList: [] }),
}));
