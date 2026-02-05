import { create } from "zustand";
import { addDays, endOfDay, startOfDay, format } from "date-fns";

export const useCustomersFilter = create((set) => ({
    searchText: "",
    filter: {
        categorySelected: [],
        sourceSelected: [],
        tagSelected: [],
        assignTo: [],
        systemFilters: [], // Thêm field cho system filters
        from: startOfDay(addDays(new Date(), -30)),
        to: endOfDay(new Date()),
        dateSelected: "-30",
        startDate: format(startOfDay(addDays(new Date(), -30)), "yyyy-MM-dd"),
        endDate: format(endOfDay(new Date()), "yyyy-MM-dd"),
        filterBody: {
            limit: 20,
            startDate: format(
                startOfDay(addDays(new Date(), -30)),
                "yyyy-MM-dd"
            ),
            endDate: format(endOfDay(new Date()), "yyyy-MM-dd"),
        }, // Mặc định 30 ngày qua
    },
    setFilter: (filter) => set({ filter }),
    sort: '[{ Column: "CreatedDate", Dir: "DESC" }]',
    setSort: (sort) => set({ sort }),
    setSearchText: (searchText) => set({ searchText }),
}));
