"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { IoIosArrowRoundBack } from "react-icons/io";
import { MdOutlineCall, MdOutlineSettings } from "react-icons/md";
import { useEffect, useState } from "react";
import SummaryCard from "./components/summary_card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HistoryTab from "./components/history_tab";
import ContactTab from "./components/contact_tab";
import ScriptTab from "./components/script_tab";
import ReportTab from "./components/report_tab";
import CallView from "./components/call_view";
import { getCallcampaignDetail } from "@/api/callcenter";
import SettingsDialog from "./components/settings_dialog";
import { useCallHandler } from "./hooks/useCallHandler";

export default function CallCampaignDetailPage({ params }) {
    const router = useRouter();
    const [campaign, setCampaign] = useState(null);
    const [openSettings, setOpenSettings] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const callHandler = useCallHandler(params.orgId, params.campaignId);

    useEffect(() => {
        getCallcampaignDetail(params.orgId, params.campaignId).then((res) => {
            if (res.code === 0) {
                setCampaign(res.content);
            }
        });
    }, [refresh]);

    return (
        <div className="flex flex-col h-full w-full">
            {!callHandler.isCall ? (
                <div className="rounded-2xl flex flex-col bg-white h-full">
                    <div className="flex items-center w-full pl-5 pr-3 py-4 border-b relative">
                        <IoIosArrowRoundBack
                            className="text-2xl cursor-pointer mr-2"
                            onClick={() => {
                                callHandler.handleHangup();
                                router.back();
                            }}
                        />
                        <div className="text-[18px] font-medium">
                            {campaign?.title}
                        </div>
                        <div className="flex gap-2 absolute right-5">
                            <Button
                                className={
                                    "flex items-center gap-1 h-[35px] px-[10px]"
                                }
                                onClick={() => {
                                    callHandler.handleCall();
                                    callHandler.setIsCall(true);
                                }}
                            >
                                <MdOutlineCall className="text-xl" />
                                Gọi ngay
                            </Button>
                            <Button
                                variant="outline"
                                className="flex items-center gap-1 h-[35px] px-[10px] text-primary border-primary hover:bg-white/90 hover:text-primary/90"
                                onClick={() => setOpenSettings(true)}
                            >
                                <MdOutlineSettings className="text-xl" />
                                Cài đặt
                            </Button>
                        </div>
                    </div>
                    <SummaryCard />

                    <Tabs defaultValue="history" className="px-5 h-full">
                        <TabsList className="border px-4 rounded-lg pb-[2px]">
                            <TabsTrigger value="history" className="text-sm">
                                Lịch sử
                            </TabsTrigger>
                            <TabsTrigger value="contact" className="text-sm">
                                Liên hệ
                            </TabsTrigger>
                            <TabsTrigger value="size" className="text-sm">
                                Kịch bản
                            </TabsTrigger>
                            <TabsTrigger value="report" className="text-sm">
                                Báo cáo
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="history">
                            <HistoryTab />
                        </TabsContent>
                        <TabsContent value="contact">
                            <ContactTab />
                        </TabsContent>
                        <TabsContent value="size">
                            <ScriptTab
                                script={campaign?.content}
                                setRefresh={setRefresh}
                            />
                        </TabsContent>
                        <TabsContent value="report">
                            <ReportTab />
                        </TabsContent>
                    </Tabs>
                </div>
            ) : (
                <CallView
                    campaign={campaign}
                    setIsCall={callHandler.setIsCall}
                    callHandler={callHandler}
                />
            )}

            {openSettings && (
                <SettingsDialog
                    open={openSettings}
                    onOpenChange={setOpenSettings}
                    campaign={campaign}
                    orgId={params.orgId}
                    setRefresh={setRefresh}
                />
            )}
        </div>
    );
}
