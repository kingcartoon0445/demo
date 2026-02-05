import { Tabs, TabsContent } from "../ui/tabs";
import { GlassTabs } from "./GlassTabs";
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
                >) || {},
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

    const tabItems = [
        { id: "timeline", label: t("common.activity") },
        { id: "note", label: t("common.note") },
        { id: "mail", label: t("common.email") || "Email" },
    ];

    if (provider === "lead" || provider === "customer") {
        tabItems.push({
            id: "attachment",
            label: t("common.attachments"),
        });
    }

    if (isCustomerInfo) {
        tabItems.push({
            id: "conversation",
            label: t("common.conversation"),
        });
    }

    return (
        <Tabs
            value={activeTab}
            className="h-full w-full flex flex-col overflow-hidden"
            onValueChange={(value) => {
                setActiveTab(value);
                if (onTabChange) {
                    onTabChange(value);
                }
            }}
        >
            <div className="w-full flex justify-between items-center bg-transparent flex-shrink-0 mb-2">
                <GlassTabs
                    tabs={tabItems}
                    activeTab={activeTab}
                    onChange={(value) => {
                        setActiveTab(value);
                        if (onTabChange) {
                            onTabChange(value);
                        }
                    }}
                    size="sm"
                    fullWidth={true}
                />
                {customer?.id && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                        title={t("common.customerDetail") || "Xem chi tiết"}
                        onClick={handleShowCustomerDetail}
                    >
                        <PanelRight className="size-4" />
                    </Button>
                )}
            </div>
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
                                    >) || {},
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
