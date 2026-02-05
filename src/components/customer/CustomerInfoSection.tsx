"use client";

import { Customer } from "@/hooks/useCustomer";
import LeadDetailSection from "./LeadDetailSection";
import CustomerDetailSection from "./CustomerDetailSection";

interface CustomerInfoSectionProps {
    customerDetail: any;
    customer: any; // Sử dụng any để tương thích với cả Customer và Lead
    orgId: string;
    displayAssignees?: any[];
}

export default function CustomerInfoSection({
    customerDetail,
    customer,
    orgId,
    displayAssignees = [],
}: CustomerInfoSectionProps) {
    return (
        <div className="space-y-4">
            {/* Phần thông tin chi tiết Lead */}
            <LeadDetailSection leadDetail={customerDetail} orgId={orgId} />

            {/* Phần thông tin khách hàng */}
            {customerDetail?.customer && (
                <CustomerDetailSection
                    showCustomerName={true}
                    customerDetail={customerDetail}
                    customer={customer}
                    orgId={orgId}
                />
            )}
        </div>
    );
}
