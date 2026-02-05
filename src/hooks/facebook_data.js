import { create } from "zustand";

export const useFbSubscriptionList = create((set) => ({
    subscriptionList: [],
    setSubscriptionList: (subscriptionList) => set({ subscriptionList }),
    resetSubscriptionList: () => set({ subscriptionList: [] }),
}));
export const useZaloSubscriptionList = create((set) => ({
    subscriptionList: [],
    setSubscriptionList: (subscriptionList) => set({ subscriptionList }),
    resetSubscriptionList: () => set({ subscriptionList: [] }),
}));