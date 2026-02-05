"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function ReactQueryProvider({
    children,
}: {
    children: ReactNode;
}) {
    // Ensure QueryClient is created once per client
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Disable automatic retries; keeps network logs clean
                        retry: false,
                        // Optional: do not refetch on window focus to reduce noise
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );
    return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}
