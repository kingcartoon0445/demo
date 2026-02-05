"use client";
import { getChatbotList, updateStatusChatBot } from "@/api/leadV2";
import LeadsLayout from "@/components/leads/LeadsLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { use, useEffect, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { MdAdd } from "react-icons/md";
import { RiRobot2Line } from "react-icons/ri";
import CreateChatbotDialog from "./components/create_chatbot_dialog";
import EditChatbotDialog from "./components/edit_chatbot.dialog";

export default function Page({ params }) {
    const orgId = use(params).orgId;
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [chatbotList, setChatbotList] = useState();
    const [selectedChatbot, setSelectedChatbot] = useState();

    const fetchData = () => {
        getChatbotList(orgId).then((res) => {
            if (res?.code != 0)
                return toast.error(
                    res?.message ?? "Đã có lỗi xảy ra xin vui lòng thử lại",
                );
            setChatbotList(res.content);
        });
    };
    useEffect(() => {
        fetchData();
    }, []);
    return (
        <LeadsLayout selectedSource="config-aichatbot" orgId={orgId}>
            <div className="flex flex-col h-full w-full">
                {open && (
                    <CreateChatbotDialog
                        open={open}
                        setOpen={setOpen}
                        orgId={orgId}
                        isDone={() => fetchData()}
                    />
                )}
                {editOpen && (
                    <EditChatbotDialog
                        trainId={selectedChatbot.id}
                        open={editOpen}
                        setOpen={setEditOpen}
                        orgId={orgId}
                        dName={selectedChatbot.title}
                        dChatbotType={selectedChatbot.typeResponse}
                        dPrompt={selectedChatbot.promptSystem}
                        dReplyType={selectedChatbot.response}
                        fbFeedList={selectedChatbot?.channels?.filter(
                            (e) =>
                                e.provider == "FACEBOOK" &&
                                e.subscribed == "feed",
                        )}
                        fbList={selectedChatbot?.channels?.filter(
                            (e) =>
                                e.provider == "FACEBOOK" &&
                                e.subscribed == "messages",
                        )}
                        zlList={selectedChatbot?.channels?.filter(
                            (e) => e.provider == "ZALO",
                        )}
                        isDone={() => fetchData()}
                    />
                )}
                <div className="rounded-2xl flex flex-col bg-white h-full">
                    <div className="flex items-center w-full justify-between pl-5 pr-3 py-4 border-b relative">
                        <div className="text-[18px] font-medium">
                            AI Chatbot
                        </div>

                        <Button
                            onClick={() => setOpen(true)}
                            className={
                                "flex items-center gap-1 h-[35px] px-[10px] absolute right-5"
                            }
                        >
                            <MdAdd className="text-xl" />
                            Thêm
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 p-4 gap-2">
                        {chatbotList?.map((e, i) => (
                            <ChatbotItem
                                key={e.id ?? i}
                                onClick={() => {
                                    setSelectedChatbot(e);
                                    setEditOpen(true);
                                }}
                                orgId={orgId}
                                e={e}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </LeadsLayout>
    );
}

const ChatbotItem = ({ e, orgId, onClick }) => {
    const [status, setStatus] = useState(e.status);
    const fbFeed = (e.channels || []).filter(
        (c) => c.provider == "FACEBOOK" && c.subscribed == "feed",
    );
    const fbMessages = (e.channels || []).filter(
        (c) => c.provider == "FACEBOOK" && c.subscribed == "messages",
    );
    const zalo = (e.channels || []).filter((c) => c.provider == "ZALO");
    return (
        <div
            onClick={onClick}
            className="p-4 rounded-lg bg-[var(--bg2)] w-full flex items-center gap-2 cursor-pointer"
        >
            <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <RiRobot2Line className="text-xl text-primary" />
                    {e.title}
                </div>

                {fbFeed.length + fbMessages.length + zalo.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                        {fbFeed.slice(0, 3).map((c, idx) => (
                            <TooltipProvider key={`${c.id ?? idx}-fbf`}>
                                <Tooltip content={c.name}>
                                    <div>
                                        <Avatar
                                            src={c.avatar || undefined}
                                            name={c.name || ""}
                                            size="20"
                                            round
                                        />
                                    </div>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                        {fbMessages.slice(0, 3).map((c, idx) => (
                            <TooltipProvider key={`${c.id ?? idx}-fbm`}>
                                <Tooltip content={c.name}>
                                    <div>
                                        <Avatar
                                            src={c.avatar || undefined}
                                            name={c.name || ""}
                                            size="20"
                                            round
                                        />
                                    </div>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                        {zalo.slice(0, 3).map((c, idx) => (
                            <TooltipProvider key={`${c.id ?? idx}-zalo`}>
                                <Tooltip content={c.name}>
                                    <div>
                                        <Avatar
                                            src={c.avatar || undefined}
                                            name={c.name || ""}
                                            size="20"
                                            round
                                        />
                                    </div>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                )}
            </div>
            <Switch
                className="ml-auto data-[state=checked]:bg-primary"
                onClick={(e) => e.stopPropagation()}
                checked={status}
                onCheckedChange={(value) => {
                    updateStatusChatBot(orgId, e.id, {
                        status: value ? 1 : 0,
                    }).then((res) => {
                        if (res?.message) return toast.error(res?.message);
                        setStatus(value);
                    });
                }}
            />
        </div>
    );
};
