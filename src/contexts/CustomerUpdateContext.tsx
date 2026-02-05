"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
    useUpdateLeadField,
    useUpdateCustomerField,
} from "@/hooks/useCustomerDetail";

interface CustomerUpdateContextType {
    updateField: (fieldName: string, value: string) => void;
    isUpdating: boolean;
}

const CustomerUpdateContext = createContext<
    CustomerUpdateContextType | undefined
>(undefined);

interface CustomerUpdateProviderProps {
    children: ReactNode;
    orgId: string;
    customerId: string;
    leadId?: string; // Required for customer provider
    provider: "lead" | "customer"; // Để phân biệt lead vs customer
}

export function CustomerUpdateProvider({
    children,
    orgId,
    customerId,
    leadId,
    provider,
}: CustomerUpdateProviderProps) {
    // Use appropriate hook based on provider
    const updateLeadFieldMutation = useUpdateLeadField(
        provider === "lead" ? orgId : "",
        provider === "lead" ? leadId || "" : ""
    );

    const updateCustomerFieldMutation = useUpdateCustomerField(
        orgId,
        customerId,
        leadId
    );

    const updateField = (fieldName: string, value: string) => {
        if (provider === "lead") {
            if (customerId) {
                updateCustomerFieldMutation.mutate({
                    fieldName,
                    value,
                });
            } else {
                // Sử dụng API update lead field
                updateLeadFieldMutation.mutate({
                    fieldName,
                    value,
                });
            }
        } else if (provider === "customer") {
            // Sử dụng API update customer field
            updateCustomerFieldMutation.mutate({
                fieldName,
                value,
            });
        }
    };

    const contextValue: CustomerUpdateContextType = {
        updateField,
        isUpdating:
            provider === "lead"
                ? updateLeadFieldMutation.isPending
                : updateCustomerFieldMutation.isPending,
    };

    return (
        <CustomerUpdateContext.Provider value={contextValue}>
            {children}
        </CustomerUpdateContext.Provider>
    );
}

export function useCustomerUpdate() {
    const context = useContext(CustomerUpdateContext);
    if (context === undefined) {
        throw new Error(
            "useCustomerUpdate must be used within a CustomerUpdateProvider"
        );
    }
    return context;
}
