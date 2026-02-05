import { create } from "zustand";
import { addDays, endOfDay, startOfDay } from "date-fns";

export const useDealsFilter = create((set) => ({
    searchText: "",
    stageGroupId: " ",
    filter: {
        tagSelected: [],
        assignTo: [],
        from: startOfDay(addDays(new Date(), -9999)),
        to: endOfDay(new Date()),
        dateSelected: "-9999",
        statusSelected: [1], // Default to "Đang xử lý" (value = 1)
        filterBody: null, // No default filter - only when user applies
        isFilterApplied: false, // Track if user has applied any filter
    },
    setFilter: (filter) => set({ filter }),
    sort: '[{ Column: "CreatedDate", Dir: "DESC" }]',
    setSort: (sort) => set({ sort }),
    setStageGroupId: (stageGroupId) => set({ stageGroupId }),
    setSearchText: (searchText) => set({ searchText }),
}));
