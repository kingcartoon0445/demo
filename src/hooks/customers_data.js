import { addDays, endOfDay, startOfDay } from "date-fns";
import { create } from "zustand";

export const useCustomerParams = create((set) => ({
  orgId: undefined,
  workspaceId: undefined,
  cid: undefined,
  setOrgId: (orgId) => set({ orgId }),
  setWorkspaceId: (workspaceId) => set({ workspaceId }),
  setCid: (cid) => set({ cid }),
  resetParams: () =>
    set({ orgId: undefined, workspaceId: undefined, cid: undefined }),
}));

export const useCustomerList = create((set) => ({
  customerList: [],
  customerSelected: undefined,
  refreshList: false,
  isRefreshing: false,
  setRefreshList: () => set((state) => ({ 
    refreshList: !state.refreshList,
    isRefreshing: state.customerList.length > 0
  })),
  refresh: false,
  setRefresh: () => set((state) => ({ refresh: !state.refresh })),
  addCustomer: undefined,
  setAddCustomer: (addCustomer) => set({ addCustomer }),
  updateData: undefined,
  setUpdateData: (updateData) => set({ updateData }),
  updateCustomer: false,
  setUpdateCustomer: () =>
    set((state) => ({ updateCustomer: !state.updateCustomer })),
  setCustomerSelected: (customerSelected) => set({ customerSelected }),
  updateCustomerList: (customerList) => set({ customerList, isRefreshing: false }),
  addCustomerToList: (newCustomer) => 
    set((state) => {
      // Kiểm tra xem khách hàng đã tồn tại trong danh sách chưa
      const exists = state.customerList.some(customer => customer.id === newCustomer.id);
      
      // Nếu đã tồn tại, trả về state hiện tại mà không thêm vào
      if (exists) {
        return state;
      }
      
      // Nếu chưa tồn tại, thêm vào và sắp xếp lại
      const updatedList = [...state.customerList, newCustomer].sort(
        (a, b) => new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate)
      );
      
      return {
        customerList: updatedList,
        isRefreshing: false
      };
    }),
  setCustomerList: (newState) =>
    set((oldState) => {
      const uniqueCustomers = new Map();
      oldState.customerList.forEach((customer) => {
        uniqueCustomers.set(customer.id, customer);
      });
      newState.forEach((customer) => {
        uniqueCustomers.set(customer.id, customer);
      });
      const mergedList = Array.from(uniqueCustomers.values()).sort(
        (a, b) => new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate)
      );
      return {
        customerList: mergedList,
        isRefreshing: false
      };
    }),
  resetCustomerList: () => set({ customerList: [], isRefreshing: false }),
}));

export const useCustomerPage = create((set) => ({
  page: 0,
  incPage: () => set((state) => ({ page: state.page + 1 })),
  resetPage: () => set({ page: 0 }),
}));

export const useCustomerFilter = create((set) => ({
  searchText: "",
  stageGroupId: " ",
  filter: {
    categorySelected: [],
    sourceSelected: [],
    tagSelected: [],
    ratingSelected: [],
    stageSelected: [],
    assignTo: [],
    teamId: [],
    from: startOfDay(addDays(new Date(), -9999)),
    to: endOfDay(new Date()),
    dateSelected: "-9999",
  },
  setFilter: (filter) => set({ filter }),
  sort: '[{ Column: "CreatedDate", Dir: "DESC" }]',
  setSort: (sort) => set({ sort }),
  setStageGroupId: (stageGroupId) => set({ stageGroupId }),
  setSearchText: (searchText) => set({ searchText }),
}));

export const useJourneyList = create((set) => ({
  page: 0,
  incPage: () => set((state) => ({ page: state.page + 1 })),
  resetPage: () => set({ page: 0 }),
  journeyList: [],
  setJourneyList: (newState) =>
    set((oldState) => ({
      journeyList: [...oldState.journeyList, ...newState],
    })),
  resetJourneyList: () => set({ journeyList: [] }),
}));
