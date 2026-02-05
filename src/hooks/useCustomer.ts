import { useQuery } from "@tanstack/react-query";
import { getCustomerList, getLeadList, getDealList } from "@/api/customerV2";
import { ApiResponse } from "@/lib/interface";

// Customer interfaces
export interface Customer {
    id: string;
    name: string; // Matched with CustomerList interface
    fullName?: string; // Keep for API compatibility
    email?: string;
    phone?: string;
    address?: string;
    avatar: string; // Required to match CustomerList
    status: string;
    source?: string;
    createdAt?: string;
    updatedAt?: string;
    lastContactDate?: string;
    lastInteraction: string; // Required to match CustomerList
    notes?: string;
    tags?: string[];
    assignedTo?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
}

export interface Lead {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    score: number;
    createdAt: string;
    updatedAt: string;
    lastActivity?: string;
    assignedTo?: string;
    campaign?: string;
    interests?: string[];
}

export interface Deal {
    id: string;
    title: string;
    customerId: string;
    customerName: string;
    value: number;
    currency: string;
    stage: string;
    probability: number;
    expectedCloseDate?: string;
    createdAt: string;
    updatedAt: string;
    assignedTo?: string;
    description?: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
}

// Hooks
export function useCustomers(
    orgId: string,
    limit: number = 10,
    offset: number = 0,
    startDate: string = "",
    endDate: string = "",
    isBusiness: boolean = false
) {
    return useQuery<ApiResponse<Customer>>({
        queryKey: ["customers", orgId, limit, offset, startDate, endDate],
        queryFn: () =>
            getCustomerList(
                orgId,
                limit,
                offset,
                startDate,
                endDate,
                isBusiness
            ),
        enabled: !!orgId,
        staleTime: 0, // 5 minutes
    });
}

export function useLeads(
    orgId: string,
    limit: number = 10,
    offset: number = 0,
    startDate: string = "",
    endDate: string = ""
) {
    return useQuery<ApiResponse<Lead>>({
        queryKey: ["leads", orgId, limit, offset, startDate, endDate],
        queryFn: () => getLeadList(orgId, limit, offset, startDate, endDate),
        enabled: !!orgId,
        staleTime: 0, // 5 minutes
    });
}

export function useDeals(orgId: string, params: object) {
    return useQuery<ApiResponse<Deal>>({
        queryKey: ["deals", orgId, params],
        queryFn: () => getDealList(orgId, params),
        enabled: !!orgId,
        staleTime: 0, // 5 minutes
    });
}
