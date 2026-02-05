import { Customer } from "@/lib/interface";
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
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Left Sidebar */}
            <CustomerSidebar
                customer={customer}
                expandedSections={expandedSections}
                onToggleSection={onToggleSection}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Header */}
                <CustomerHeader
                    customerName={customer.fullName}
                    orgId={orgId}
                    customerId={customer.id}
                    assignees={customer.assignees}
                    customerSelected={customer}
                />

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                    <TabsUserDetail
                        taskId={null}
                        provider="customer"
                        customer={customer}
                        orgId={orgId}
                        workspaceId={customer.workspaceId}
                    />
                </div>
            </div>
        </div>
    );
}
