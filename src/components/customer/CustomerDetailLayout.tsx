import { Glass } from "../Glass";
import { Customer } from "@/lib/interface";
import { useState } from "react";
import CustomerSidebar from "./CustomerSidebar";
import CustomerHeader from "./CustomerHeader";
import TabsUserDetail from "@/components/common/TabsUserDetail";

interface CustomerDetailLayoutProps {
    customer: Customer;
    orgId: string;
    expandedSections: {
        summary: boolean;
        details: boolean;
        organization: boolean;
        deals: boolean;
        overview: boolean;
        smartBcc: boolean;
        leads: boolean;
    };
    onToggleSection: (section: string) => void;
}

export default function CustomerDetailLayout({
    customer,
    orgId,
    expandedSections,
    onToggleSection,
}: CustomerDetailLayoutProps) {
    const [showSidebar, setShowSidebar] = useState(true);

    return (
        <Glass
            intensity="medium"
            className="flex flex-col h-screen rounded-2xl mr-2 shadow-xl"
        >
            {/* Top Header */}
            <CustomerHeader
                customerName={customer.fullName}
                orgId={orgId}
                customerId={customer.id}
                assignees={customer.assignees}
                customerSelected={customer}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                {showSidebar && (
                    <CustomerSidebar
                        customer={customer}
                        expandedSections={expandedSections}
                        onToggleSection={onToggleSection}
                        hideHeader={true}
                    />
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 p-4">
                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                        <TabsUserDetail
                            taskId={null}
                            provider="customer"
                            customer={customer}
                            orgId={orgId}
                            workspaceId={customer.workspaceId}
                            handleShowCustomerDetail={() =>
                                setShowSidebar((prev) => !prev)
                            }
                        />
                    </div>
                </div>
            </div>
        </Glass>
    );
}
