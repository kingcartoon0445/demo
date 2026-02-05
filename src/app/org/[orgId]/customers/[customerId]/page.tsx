"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Customer } from "@/lib/interface";
import { useCustomerDetailApi } from "@/hooks/useCustomerDetail";
import CustomerDetailLayout from "@/components/customer/CustomerDetailLayout";
import { use } from "react";

interface CustomerDetailPageProps {
    params: Promise<{
        orgId: string;
        customerId: string;
    }>;
}

export default function CustomerDetailPage({
    params,
}: CustomerDetailPageProps) {
    const { orgId, customerId } = use(params);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const { data: customerData } = useCustomerDetailApi(orgId, customerId);

    const [expandedSections, setExpandedSections] = useState({
        summary: true,
        details: true,
        organization: true,
        deals: true,
        overview: true,
        smartBcc: false,
        leads: true,
    });

    // Update customer data when API response changes
    useEffect(() => {
        setCustomer(customerData?.content as Customer);
    }, [customerData]);

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section as keyof typeof prev],
        }));
    };

    if (!customer) {
        return (
            <div className="flex items-center justify-center h-screen">
                Loading...
            </div>
        );
    }

    return (
        <CustomerDetailLayout
            customer={customer}
            orgId={orgId}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
        />
    );
}
