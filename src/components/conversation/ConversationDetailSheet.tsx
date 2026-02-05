"use client";

import { getCustomerDetail, getLeadDetail } from "@/api/customerV2";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
    useGetDetailConversation,
    type Conversation,
} from "@/hooks/useConversation";
import { Customer, Lead } from "@/hooks/useCustomer";
import { getFirstAndLastWord } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";
import { toast } from "react-hot-toast";
import FindCustomerModal from "../common/FindCustomerModal";
import FindDealModal from "../common/FindDealModal";
import FindLeadModal from "../common/FindLeadModal";
import CustomerDetailSection from "../customer/CustomerDetailSection";
import LeadDetailSection from "../customer/LeadDetailSection";
import AddNewDealModal from "../deals/AddNewDealModal";
import { Button } from "../ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { readConversation } from "@/api/facebook";
import { useQueryClient } from "@tanstack/react-query";

interface ConversationDetailSheetProps {
    conversation: Conversation | null;
    orgId?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProviderChange: (provider: string) => void;
    onOpenAddCustomerModal: () => void;
}

export default function ConversationDetailSheet({
    conversation,
    orgId,
    open,
    onOpenChange,
    onProviderChange,
    onOpenAddCustomerModal,
}: ConversationDetailSheetProps) {
    const { t } = useLanguage();
    const {
        data: detailConversationResponse,
        isLoading: isLoadingDetailConversation,
    } = useGetDetailConversation(orgId || "", conversation?.id || "");
    const detailConversation = (detailConversationResponse as any)?.content;
    const [lead, setLead] = useState<Lead | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);

    const [isFindCustomerModalOpen, setIsFindCustomerModalOpen] =
        useState(false);
    const [isFindDealModalOpen, setIsFindDealModalOpen] = useState(false);
    const [isFindLeadModalOpen, setIsFindLeadModalOpen] = useState(false);
    const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
    const queryClient = useQueryClient();
    useEffect(() => {
        // Reset state khi conversation thay đổi
        setLead(null);
        setCustomer(null);

        if (detailConversationResponse && detailConversation) {
            if (!detailConversation.isRead) {
                const readConversationResponse = async () => {
                    await readConversation(orgId || "", detailConversation.id);
                };

                queryClient.invalidateQueries({
                    queryKey: ["channelStatus", orgId],
                });
                readConversationResponse();
            }
            if (detailConversation.lead) {
                const fetchLead = async () => {
                    const response = await getLeadDetail(
                        orgId || "",
                        detailConversation.lead.id
                    );
                    setLead(response.content);
                };
                fetchLead();
            }
            if (detailConversation.customer) {
                const fetchCustomer = async () => {
                    const response = await getCustomerDetail(
                        orgId || "",
                        detailConversation.customer.id
                    );
                    setCustomer(response.content);
                };
                fetchCustomer();
            }
            if (detailConversation.deal) {
                if (detailConversation.deal.customerId) {
                    const fetchCustomer = async () => {
                        const response = await getCustomerDetail(
                            orgId || "",
                            detailConversation.deal.customerId
                        );
                        setCustomer(response.content);
                    };
                    fetchCustomer();
                }
                if (detailConversation.deal.leadId) {
                    const fetchLead = async () => {
                        const response = await getLeadDetail(
                            orgId || "",
                            detailConversation.deal.leadId
                        );
                        setLead(response.content);
                    };
                    fetchLead();
                }
                if (
                    detailConversation.deal.customerId &&
                    detailConversation.deal.leadId
                ) {
                    const fetchCustomer = async () => {
                        const response = await getCustomerDetail(
                            orgId || "",
                            detailConversation.deal.customerId
                        );
                        setCustomer(response.content);
                    };
                    fetchCustomer();
                }
            }
        }
    }, [detailConversationResponse, conversation?.id]);

    const handleRefreshCustomer = () => {
        if (customer) {
            const fetchCustomer = async () => {
                const response = await getCustomerDetail(
                    orgId || "",
                    customer.id
                );
                setCustomer(response.content);
            };
            fetchCustomer();
        }
    };

    const handleCreateNewDeal = () => {
        toast.success("Thêm giao dịch mới");
        // Add your logic here
    };

    const handleSelectCustomer = (customer: {
        id: string;
        fullName: string;
        phone?: string;
    }) => {};

    const handleOpenAddCustomerModal = () => {
        onOpenAddCustomerModal();
        onProviderChange("customer");
    };

    const handleOpenAddLeadModal = () => {
        onOpenAddCustomerModal();
        onProviderChange("lead");
    };

    const renderContent = () => {
        if (!conversation) {
            return (
                <div className="text-center text-muted-foreground p-6">
                    <p>{t("common.selectConversation")}</p>
                </div>
            );
        }

        const derivedFullName =
            detailConversation?.fullName || conversation.fullName || "";
        const derivedAvatar =
            detailConversation?.avatar || conversation.avatar || "";

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center gap-3">
                    <Avatar
                        name={getFirstAndLastWord(derivedFullName)}
                        src={derivedAvatar}
                        size="72"
                        round={true}
                    />
                    <div className="flex-1 flex flex-col items-center">
                        <h2 className="font-semibold text-lg">
                            {derivedFullName}
                        </h2>
                        <div className="text-sm text-gray-500"></div>
                    </div>
                </div>

                {lead ? (
                    <LeadDetailSection
                        leadDetail={lead}
                        orgId={orgId || ""}
                        conversationId={conversation?.id}
                    />
                ) : (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-gray-900 mb-1">
                                {t("common.opportunity")}/{t("common.deals")}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {t("common.selectOpportunityOrDeal")}
                            </p>

                            <div className="flex flex-col gap-2">
                                {/* Thêm vào có sẵn button group */}
                                <div className="flex flex-1">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setIsFindLeadModalOpen(true)
                                        }
                                        className="flex-1 rounded-r-none border-r-0"
                                    >
                                        {t("common.chooseExistingOpportunity")}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="rounded-l-none border-l-0 px-2"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setIsFindDealModalOpen(true)
                                                }
                                            >
                                                {t("common.chooseExistingDeal")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Thêm mới button group */}
                                <div className="flex flex-1">
                                    <Button
                                        onClick={handleOpenAddLeadModal}
                                        className="flex-1 rounded-r-none border-r-0"
                                    >
                                        {t("common.createNewOpportunity")}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="rounded-l-none border-l-0 px-2">
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setIsAddDealModalOpen(true)
                                                }
                                            >
                                                {t("common.createNewDeal")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Customer Section */}
                {customer ? (
                    <CustomerDetailSection
                        customer={customer}
                        orgId={orgId || ""}
                        conversationId={conversation?.id}
                        onRefreshCustomer={handleRefreshCustomer}
                        showCustomerName={true}
                    />
                ) : (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-gray-900 mb-1">
                                {t("common.customer")}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {t("common.selectCustomer")}
                            </p>

                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() =>
                                        setIsFindCustomerModalOpen(true)
                                    }
                                >
                                    {t("common.chooseExistingCustomer")}
                                </Button>
                                <Button
                                    className="flex-1 bg-primary text-white"
                                    onClick={handleOpenAddCustomerModal}
                                >
                                    {t("common.createNewCustomer")}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Opportunity Section */}
            </div>
        );
    };

    return (
        <>
            {open ? (
                <Sheet open={open} onOpenChange={onOpenChange}>
                    <SheetContent
                        side="right"
                        className="w-full sm:max-w-md overflow-y-auto"
                    >
                        <div className="p-2">{renderContent()}</div>
                    </SheetContent>
                </Sheet>
            ) : (
                <div className="h-full bg-background overflow-y-auto">
                    <div className="p-2">{renderContent()}</div>
                </div>
            )}
            {/* Find Customer Modal */}
            {isFindCustomerModalOpen && (
                <FindCustomerModal
                    orgId={orgId || ""}
                    open={isFindCustomerModalOpen}
                    onOpenChange={setIsFindCustomerModalOpen}
                    onSelect={handleSelectCustomer}
                    conversationId={conversation?.id}
                    provider={"customer"}
                />
            )}
            {/* Find Deal Modal */}
            {isFindDealModalOpen && (
                <FindDealModal
                    orgId={orgId || ""}
                    open={isFindDealModalOpen}
                    onOpenChange={setIsFindDealModalOpen}
                    onSelect={() => {}}
                    conversationId={conversation?.id}
                />
            )}
            {/* Find Lead Modal */}
            {isFindLeadModalOpen && (
                <FindLeadModal
                    orgId={orgId || ""}
                    open={isFindLeadModalOpen}
                    onOpenChange={setIsFindLeadModalOpen}
                    onSelect={() => {}}
                    conversationId={conversation?.id}
                />
            )}
            {/* Add Deal Modal */}
            {isAddDealModalOpen && (
                <AddNewDealModal
                    orgId={orgId || ""}
                    isOpen={isAddDealModalOpen}
                    onClose={() => setIsAddDealModalOpen(false)}
                    onSubmit={() => {}}
                    conversationId={conversation?.id}
                />
            )}
        </>
    );
}
