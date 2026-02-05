import { create } from "zustand";
import { addDays, endOfDay, startOfDay } from "date-fns";

export const useLeadsFilter = create((set) => ({
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
        systemFilters: [], // Thêm field cho system filters
        from: startOfDay(addDays(new Date(), -9999)),
        to: endOfDay(new Date()),
        dateSelected: "-9999",
        startDate: "",
        endDate: "",
        filterBody: {
            limit: 20,
        }, // Default filter body with limit
    },
    // Filter riêng cho archive mode
    archiveFilter: {
        categorySelected: [],
        sourceSelected: [],
        tagSelected: [],
        ratingSelected: [],
        stageSelected: [],
        assignTo: [],
        teamId: [],
        systemFilters: [],
        from: startOfDay(addDays(new Date(), -9999)),
        to: endOfDay(new Date()),
        dateSelected: "-9999",
        startDate: "",
        endDate: "",
        filterBody: {
            limit: 20,
        },
    },
    setFilter: (filter) => set({ filter }),
    setArchiveFilter: (archiveFilter) => set({ archiveFilter }),
    sort: '[{ Column: "CreatedDate", Dir: "DESC" }]',
    setSort: (sort) => set({ sort }),
    setStageGroupId: (stageGroupId) => set({ stageGroupId }),
    setSearchText: (searchText) => set({ searchText }),
}));
