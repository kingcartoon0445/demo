import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import CustomerJourney from "./CustomerJourney";
import { ScrollArea } from "../ui/scroll-area";
import { DetailDeal, Lead } from "@/lib/interface";
import CustomerNote from "./CustomerNote";
import SendMail from "./SendMail";
import UploadAttachment from "./UploadAttachment";
import { CustomerInfo } from "@/interfaces/businessProcess";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { PanelRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Conversation } from "@/hooks/useConversation";
import ConversationTimeline from "../conversation/ConversationTimeline";

export default function TabsUserDetail({
    taskId,
    customer,
    orgId,
    workspaceId,
    provider,
    handleShowCustomerDetail,
    refreshStage,
    setIsIncludeConversation,
    onTabChange,
}: {
    taskId: string | null;
    customer: Lead | DetailDeal | CustomerInfo | null;
    orgId: string;
    workspaceId: string;
    provider: string;
    handleShowCustomerDetail?: () => void;
    refreshStage?: () => void;
    setIsIncludeConversation?: (isIncludeConversation: boolean) => void;
    onTabChange?: (tab: string) => void;
}) {
    const [isCustomerInfo, setIsCustomerInfo] = useState(false);
    useEffect(() => {
        if (!customer) return;
        const hasSingleConversation =
            !!(customer as CustomerInfo).conversation &&
            Object.keys(
                ((customer as CustomerInfo).conversation as Record<
                    string,
                    unknown
                >) || {}
            ).length > 0;
        const hasConversationArray =
            Array.isArray((customer as any).conversations) &&
            ((customer as any).conversations as unknown[]).length > 0;
        if (hasSingleConversation || hasConversationArray) {
            setIsCustomerInfo(true);
            if (setIsIncludeConversation) {
                setIsIncludeConversation(true);
            }
        } else {
            setIsCustomerInfo(false);
            if (setIsIncludeConversation) {
                setIsIncludeConversation(false);
            }
        }
    }, [customer]);

    const [activeTab, setActiveTab] = useState("timeline");
    const { t } = useLanguage();
    return (
        <Tabs
            defaultValue="timeline"
            className="h-full w-full flex flex-col overflow-hidden"
            onValueChange={(value) => {
                setActiveTab(value);
                if (onTabChange) {
                    onTabChange(value);
                }
            }}
        >
            <TabsList className="w-full border-b border-gray-200 p-0 bg-white flex justify-between flex-shrink-0">
                <>
                    <TabsTrigger
                        className={`${
                            provider === "lead" && handleShowCustomerDetail
                                ? "w-1/5"
                                : "w-1/4"
                        } data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none`}
                        value="timeline"
                    >
                        {t("common.activity")}
                    </TabsTrigger>
                    <TabsTrigger
                        className={`${
                            provider === "lead" && handleShowCustomerDetail
                                ? "w-1/5"
                                : "w-1/4"
                        } data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none`}
                        value="note"
                    >
                        {t("common.note")}
                    </TabsTrigger>

                    <TabsTrigger
                        className={`${
                            provider === "lead" && handleShowCustomerDetail
                                ? "w-1/5"
                                : "w-1/4"
                        } data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none`}
                        value="mail"
                    >
                        {t("common.email") || "Email"}
                    </TabsTrigger>

                    {(provider === "lead" || provider === "customer") && (
                        <TabsTrigger
                            className={`${
                                provider === "lead" && handleShowCustomerDetail
                                    ? "w-1/5"
                                    : "w-1/4"
                            } data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none`}
                            value="attachment"
                        >
                            {t("common.attachments")}
                        </TabsTrigger>
                    )}

                    {isCustomerInfo && (
                        <TabsTrigger
                            className={`${
                                provider === "lead" && handleShowCustomerDetail
                                    ? "w-1/5"
                                    : "w-1/4"
                            } data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none`}
                            value="conversation"
                        >
                            {t("common.conversation")}
                        </TabsTrigger>
                    )}
                </>
                <>
                    {handleShowCustomerDetail && (
                        <Button
                            variant="outline"
                            onClick={handleShowCustomerDetail}
                            className="p-2 hover:bg-muted rounded-lg transition-colors 2xl:hidden border-none shadow-none"
                            title="Xem chi tiết khách hàng"
                        >
                            <PanelRight className="size-4" />
                        </Button>
                    )}
                </>
            </TabsList>
            <TabsContent
                value="timeline"
                className="flex-1 flex flex-col w-full min-h-0 overflow-hidden"
            >
                <ScrollArea className="flex-1 h-full w-full">
                    <div className="pb-4 h-full w-full">
                        {activeTab === "timeline" && (
                            <CustomerJourney
                                taskId={taskId}
                                customer={customer as Lead | CustomerInfo}
                                orgId={orgId || ""}
                                workspaceId={workspaceId || ""}
                                provider={provider || ""}
                                refreshStage={refreshStage}
                            />
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>
            <TabsContent
                value="note"
                className="flex-1 min-h-0 overflow-hidden"
            >
                <CustomerNote
                    provider={provider || ""}
                    orgId={orgId || ""}
                    customerId={customer?.id || ""}
                    taskId={taskId || ""}
                />
            </TabsContent>
            <TabsContent
                value="conversation"
                className="flex-1 flex flex-col w-full min-h-0 overflow-hidden"
            >
                <div className="flex-1 min-h-0 overflow-hidden">
                    <ConversationTimeline
                        conversation={((): Conversation | null => {
                            if (!customer) return null;
                            const single = (customer as CustomerInfo)
                                .conversation as unknown as
                                | Conversation
                                | undefined;
                            if (
                                single &&
                                Object.keys(
                                    (single as unknown as Record<
                                        string,
                                        unknown
                                    >) || {}
                                ).length > 0
                            ) {
                                return single;
                            }
                            const list = (customer as any).conversations as
                                | Conversation[]
                                | undefined;
                            if (Array.isArray(list) && list.length > 0) {
                                return list[0] as Conversation;
                            }
                            return null;
                        })()}
                        orgId={orgId || ""}
                        onShowConversationDetail={() => {}}
                    />
                </div>
            </TabsContent>
            <TabsContent
                value="mail"
                className="flex-1 min-h-0 overflow-hidden"
            >
                <ScrollArea className="flex-1 h-full w-full">
                    <SendMail
                        orgId={orgId || ""}
                        customer={customer}
                        provider={provider as "lead" | "customer"}
                    />
                </ScrollArea>
            </TabsContent>

            <TabsContent
                value="attachment"
                className="flex-1 min-h-0 overflow-hidden"
            >
                <UploadAttachment
                    provider={provider || ""}
                    orgId={orgId}
                    leadId={customer?.id || ""}
                    taskId={taskId || ""}
                />
            </TabsContent>
        </Tabs>
    );
}
