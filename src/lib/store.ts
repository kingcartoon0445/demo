import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AppState {
    // Example state
    user: {
        id: string | null;
        name: string | null;
        email: string | null;
    };
    isLoading: boolean;

    // Actions
    setUser: (user: { id: string; name: string; email: string } | null) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

const initialState = {
    user: {
        id: null,
        name: null,
        email: null,
    },
    isLoading: false,
};

export const useAppStore = create<AppState>()(
    devtools(
        persist(
            (set) => ({
                ...initialState,

                setUser: (user) => set({ user: user || initialState.user }),
                setLoading: (isLoading) => set({ isLoading }),
                reset: () => set(initialState),
            }),
            {
                name: "app-store",
                partialize: (state) => ({ user: state.user }),
            }
        ),
        {
            name: "app-store",
        }
    )
);
