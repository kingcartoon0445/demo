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
import { Glass } from "../Glass";

interface CustomerSidebarProps {
    customer: Customer;
    orgId?: string;
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
    className?: string;
    hideHeader?: boolean;
}

export default function CustomerSidebar({
    customer,
    orgId: propOrgId,
    expandedSections,
    onToggleSection,
    className,
    hideHeader = false,
}: CustomerSidebarProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const params = useParams();
    const orgId = propOrgId || (params.orgId as string);

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
        <Glass
            intensity="low"
            border={false}
            className={`flex flex-col h-full border-r border-white/20 shadow-lg rounded-none ${
                className || "w-80"
            }`}
        >
            {/* Customer Header */}
            {!hideHeader && (
                <Glass
                    intensity="medium"
                    border={false}
                    className="px-4 pt-4 pb-3 border-b border-white/20 rounded-none"
                >
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => router.back()}>
                            <ArrowLeftIcon className="w-4 h-4" />
                        </Button>
                        <Avatar
                            name={getFirstAndLastWord(customer.fullName || "")}
                            size="24"
                            src={
                                getAvatarUrl(customer.avatar || "") || undefined
                            }
                            round={true}
                            className="rounded-full"
                        />
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">
                                {customer.fullName}
                            </h2>
                        </div>
                    </div>
                </Glass>
            )}

            {/* Expandable Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Summary */}
                {/* <div className="border border-gray-200 rounded-xl">
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
                                <{customer.email}
                            </div>
                            <div className="text-sm flex items-center gap-2">
                                <Phone className="size-3" />
                                <{customer.phone}
                            </div>
                        </div>
                    )}
                </div> */}

                {/* Details */}
                <Glass
                    intensity="low"
                    className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                    <button
                        onClick={() => onToggleSection("details")}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-white/40 transition-colors rounded-xl font-medium"
                    >
                        <span className="text-gray-700">
                            {t("common.details")}
                        </span>
                        {expandedSections.details ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
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
                </Glass>

                {/* Organization */}
                {/* <div className="border border-gray-200 rounded-xl">
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
                <Glass
                    intensity="low"
                    className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                    <button
                        onClick={() => onToggleSection("deals")}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-white/40 transition-colors rounded-xl font-medium"
                    >
                        {/* <DollarSign className="h-4 w-4" /> */}
                        <span className="text-gray-700">
                            {t("common.deals")}
                        </span>
                        <div className="flex items-center gap-2">
                            {/* <Plus className="h-4 w-4 text-green-600" /> */}
                            {expandedSections.deals ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
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
                                            className="p-2 rounded-lg hover:bg-gray-100/80 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                                        >
                                            <div className="text-sm font-medium text-gray-900">
                                                {deal.title ||
                                                    deal.title ||
                                                    "Deal"}
                                            </div>
                                            {deal.value && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Intl.NumberFormat(
                                                        "vi-VN",
                                                        {
                                                            style: "currency",
                                                            currency: "VND",
                                                        },
                                                    ).format(deal.value)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic p-2">
                                    {t("common.noDeals")}
                                </div>
                            )}
                        </div>
                    )}
                </Glass>

                {/* Leads */}
                <Glass
                    intensity="low"
                    className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                    <button
                        onClick={() => onToggleSection("leads")}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-white/40 transition-colors rounded-xl font-medium"
                    >
                        {/* <Users className="h-4 w-4" /> */}
                        <span className="text-gray-700">
                            {t("common.leads")}
                        </span>
                        <div className="flex items-center gap-2">
                            {/* <Plus className="h-4 w-4 text-green-600" /> */}
                            {expandedSections.leads ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
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
                                            className="p-2 rounded-lg hover:bg-gray-100/80 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                                        >
                                            <div className="text-sm font-medium text-gray-900">
                                                {lead.fullName || "Lead"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic p-2">
                                    {t("common.noLeads")}
                                </div>
                            )}
                        </div>
                    )}
                </Glass>
            </div>
        </Glass>
    );
}
