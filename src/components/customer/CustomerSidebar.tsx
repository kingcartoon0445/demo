import { useLanguage } from "@/contexts/LanguageContext";
import { Customer } from "@/lib/interface";
import {
    formatRelativeTime,
    getAvatarUrl,
    getFirstAndLastWord,
} from "@/lib/utils";
import {
    ArrowLeftIcon,
    ChevronDown,
    ChevronRight,
    Mail,
    Phone,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Avatar from "react-avatar";
import CustomerDetailSection from "./CustomerDetailSection";
import { CustomerUpdateProvider } from "@/contexts/CustomerUpdateContext";
import { Button } from "../ui/button";

interface CustomerSidebarProps {
    customer: Customer;
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

export default function CustomerSidebar({
    customer,
    expandedSections,
    onToggleSection,
}: CustomerSidebarProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const { orgId } = useParams();

    // Handle lead click navigation
    const handleLeadClick = (leadId: string) => {
        router.push(`/org/${orgId}/leads?cid=${leadId}`);
    };

    // Handle deal click navigation
    const handleDealClick = (deal: any) => {
        const workspaceId = deal.workspaceId || customer.workspaceId;
        const orderId = deal.orderId;
        router.push(`/org/${orgId}/deals?wid=${workspaceId}&oid=${orderId}`);
    };
    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Customer Header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Button>
                    <Avatar
                        name={getFirstAndLastWord(customer.fullName || "")}
                        size="24"
                        src={getAvatarUrl(customer.avatar || "") || undefined}
                        round={true}
                        className="rounded-full"
                    />
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            {customer.fullName}
                        </h2>
                        {/* <p className="text-sm text-gray-500">
                            {customer.position}
                        </p> */}
                    </div>
                </div>
            </div>

            {/* Expandable Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Summary */}
                {/* <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => onToggleSection("summary")}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
                    >
                        <span className="font-medium">
                            {t("common.summary")}
                        </span>
                        {expandedSections.summary ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                    {expandedSections.summary && (
                        <div className="px-3 pb-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <Mail className="size-3" />
                                {customer.email}
                            </div>
                            <div className="text-sm flex items-center gap-2">
                                <Phone className="size-3" />
                                {customer.phone}
                            </div>
                        </div>
                    )}
                </div> */}

                {/* Details */}
                <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => onToggleSection("details")}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
                    >
                        <span className="font-medium">
                            {t("common.details")}
                        </span>
                        {expandedSections.details ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                    {expandedSections.details && (
                        <div className="px-3 pb-3">
                            <CustomerUpdateProvider
                                orgId={orgId as string}
                                customerId={customer.id}
                                provider="customer"
                            >
                                <CustomerDetailSection
                                    customer={customer}
                                    orgId={orgId as string}
                                    showCustomerName={true}
                                />
                            </CustomerUpdateProvider>
                        </div>
                    )}
                </div>

                {/* Organization */}
                {/* <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => onToggleSection("organization")}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
                    >
                        <Building className="h-4 w-4" />
                        <span className="font-medium">
                            {t("common.organization")}
                        </span>
                        {expandedSections.organization ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                    {expandedSections.organization && (
                        <div className="px-3 pb-3">
                            
                        </div>
                    )}
                </div> */}

                {/* Deals */}
                <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => onToggleSection("deals")}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
                    >
                        {/* <DollarSign className="h-4 w-4" /> */}
                        <span className="font-medium">{t("common.deals")}</span>
                        <div className="flex items-center gap-2">
                            {/* <Plus className="h-4 w-4 text-green-600" /> */}
                            {expandedSections.deals ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </div>
                    </button>
                    {expandedSections.deals && (
                        <div className="px-3 pb-3">
                            {customer.deals && customer.deals.length > 0 ? (
                                <div className="space-y-2">
                                    {customer.deals.map((deal: any) => (
                                        <div
                                            key={deal.id}
                                            onClick={() =>
                                                handleDealClick(deal)
                                            }
                                            className="p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                            <div className="text-sm font-medium text-gray-900">
                                                {deal.title ||
                                                    deal.title ||
                                                    "Deal"}
                                            </div>
                                            {deal.value && (
                                                <div className="text-xs text-gray-500">
                                                    {new Intl.NumberFormat(
                                                        "vi-VN",
                                                        {
                                                            style: "currency",
                                                            currency: "VND",
                                                        }
                                                    ).format(deal.value)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    {t("common.noDeals")}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Leads */}
                <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => onToggleSection("leads")}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
                    >
                        {/* <Users className="h-4 w-4" /> */}
                        <span className="font-medium">{t("common.leads")}</span>
                        <div className="flex items-center gap-2">
                            {/* <Plus className="h-4 w-4 text-green-600" /> */}
                            {expandedSections.leads ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </div>
                    </button>
                    {expandedSections.leads && (
                        <div className="px-3 pb-3">
                            {customer.leads && customer.leads.length > 0 ? (
                                <div className="space-y-2">
                                    {customer.leads.map((lead: any) => (
                                        <div
                                            key={lead.id}
                                            onClick={() =>
                                                handleLeadClick(lead.id)
                                            }
                                            className="p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                                        >
                                            <div className="text-sm font-medium text-gray-900">
                                                {lead.fullName || "Lead"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    {t("common.noLeads")}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
