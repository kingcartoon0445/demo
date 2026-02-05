import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { RiRobot2Line } from "react-icons/ri";
import { FbbMessListDialog } from "./fbmess_list_dialog";
import { MdClose } from "react-icons/md";
import { ZlMessListDialog } from "./zalomess_list_dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import { createChatBot } from "@/api/leadV2";
import FBFeedListDialog from "./FBFeedListDialog";

export default function CreateChatbotDialog({ open, setOpen, orgId, isDone }) {
    const [openFbList, setOpenFbList] = useState(false);
    const [openFbFeedList, setOpenFbFeedList] = useState(false);
    const [openZlList, setOpenZlList] = useState(false);
    const [name, setName] = useState();
    const [fbFeedSelectedList, setFbFeedSelectedList] = useState([]);
    const [fbSelectedList, setFbSelectedList] = useState([]);
    const [zlSelectedList, setZlSelectedList] = useState([]);
    const [replyType, setReplyType] = useState(2);
    const [chatBotType, setChatBotType] = useState("AI");
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = () => {
        if (isLoading) return;
        if (!name)
            return toast.error("Vui lòng nhập tên kịch bản", {
                position: "top-center",
            });
        if (!prompt)
            return toast.error("Vui lòng nhập kịch bản", {
                position: "top-center",
            });
        setIsLoading(true);
        toast.promise(
            createChatBot(orgId, {
                connectionIds: [
                    ...fbSelectedList.map((e) => e.id),
                    ...zlSelectedList.map((e) => e.id),
                    ...fbFeedSelectedList.map((e) => e.id),
                ],
                title: name,
                description: "",
                promptSystem: prompt,
                promptUser: "",
                response: replyType,
                typeResponse: chatBotType,
            })
                .then((res) => {
                    setIsLoading(false);
                    if (res?.message) return toast.error(res.message);
                    toast.success("Tạo kịch bản thành công");
                    isDone();
                    setOpen(false);
                })
                .catch((e) => {
                    setIsLoading(false);
                }),
            {
                loading: "Đang tạo kịch bản",
            },
            {
                success: {
                    style: {
                        display: "none",
                    },
                },
                error: {
                    style: {
                        display: "none",
                    },
                },
            }
        );
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {openFbFeedList && (
                <FBFeedListDialog
                    open={openFbFeedList}
                    setOpen={setOpenFbFeedList}
                    orgId={orgId}
                    selectedList={fbFeedSelectedList}
                    setSelectedList={setFbFeedSelectedList}
                />
            )}
            {openFbList && (
                <FbbMessListDialog
                    open={openFbList}
                    setOpen={setOpenFbList}
                    orgId={orgId}
                    selectedList={fbSelectedList}
                    setSelectedList={setFbSelectedList}
                />
            )}
            {openZlList && (
                <ZlMessListDialog
                    open={openZlList}
                    setOpen={setOpenZlList}
                    orgId={orgId}
                    selectedList={zlSelectedList}
                    setSelectedList={setZlSelectedList}
                />
            )}
            <DialogContent className="min-w-[1200px] max-h-[88dvh] flex gap-4 overflow-y-auto">
                <div className="flex flex-col w-full h-full">
                    <DialogHeader>
                        <DialogTitle
                            className={
                                "font-medium text-[18px] text-title flex items-center justify-between mb-3"
                            }
                        >
                            Tạo mới kịch bản
                        </DialogTitle>
                        <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6" />
                    </DialogHeader>

                    <div className="mt-3 px-3 py-4 rounded-lg bg-[var(--bg2)] w-full flex items-center gap-2">
                        <div className="w-[40px] h-[40px] bg-[#E3DFFF] rounded-xl text-xl flex items-center justify-center text-primary">
                            <RiRobot2Line />
                        </div>
                        <div className="flex flex-col text-title text-xs leading-[1.4]">
                            <div className="font-medium text-[18px]">
                                AI Chatbot
                            </div>
                            {/* Thanh toán: 20/08/2024 */}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col flex-1">
                            <div className="font-medium text-sm mt-4">
                                Tên kịch bản
                                <span className="text-[#FF0000]">*</span>
                            </div>
                            <Input
                                placeholder="Nhập tên"
                                className="mt-2 bg-[var(--bg1)] outline-none border-none"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <div className="font-medium text-sm mt-4">
                                Chọn kênh kết nối
                            </div>
                            <div
                                onClick={() => {
                                    setOpenFbFeedList(true);
                                }}
                                className="flex flex-col px-3 py-2 rounded-lg bg-[var(--bg1)] mt-2 cursor-pointer hover:bg-accent"
                            >
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={"/icons/messenger.svg"}
                                        alt="ico"
                                        width={35}
                                        height={35}
                                        className="w-[35px] h-auto"
                                    />
                                    <span className="font-medium text-sm">
                                        Facebook Feed
                                    </span>
                                    <IoIosArrowForward className="ml-auto" />
                                </div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {fbFeedSelectedList.map((e, i) => (
                                        <div
                                            className="p-2 rounded-lg text-xs border flex items-center gap-2 border-[#1F2329]"
                                            key={i}
                                        >
                                            {e.name || e.title}
                                            <MdClose
                                                onClick={(elm) => {
                                                    elm.stopPropagation();
                                                    setFbFeedSelectedList(
                                                        (prev) =>
                                                            prev.filter(
                                                                (item) =>
                                                                    item.id !==
                                                                    e.id
                                                            )
                                                    );
                                                }}
                                                className="text-title"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div
                                onClick={(e) => {
                                    setOpenFbList(true);
                                }}
                                className="flex flex-col px-3 py-2 rounded-lg bg-[var(--bg1)] mt-2 cursor-pointer hover:bg-accent"
                            >
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={"/icons/messenger.svg"}
                                        alt="ico"
                                        width={35}
                                        height={35}
                                        className="w-[35px] h-auto"
                                    />
                                    <span className="font-medium text-sm">
                                        Facebook Messager
                                    </span>
                                    <IoIosArrowForward className="ml-auto" />
                                </div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {fbSelectedList.map((e, i) => (
                                        <div
                                            className="p-2 rounded-lg text-xs border flex items-center gap-2 border-[#1F2329]"
                                            key={i}
                                        >
                                            {e.name}
                                            <MdClose
                                                onClick={(elm) => {
                                                    elm.stopPropagation();
                                                    setFbSelectedList((prev) =>
                                                        prev.filter(
                                                            (item) =>
                                                                item.id !== e.id
                                                        )
                                                    );
                                                }}
                                                className="text-title"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div
                                onClick={(e) => {
                                    setOpenZlList(true);
                                }}
                                className="flex flex-col px-3 py-2 rounded-lg bg-[var(--bg1)] mt-2 cursor-pointer hover:bg-accent"
                            >
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={"/icons/zalo.svg"}
                                        alt="ico"
                                        width={35}
                                        height={35}
                                        className="w-[35px] h-auto"
                                    />
                                    <span className="font-medium text-sm">
                                        Zalo OA
                                    </span>
                                    <IoIosArrowForward className="ml-auto" />
                                </div>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {zlSelectedList.map((e, i) => (
                                        <div
                                            className="p-2 rounded-lg text-xs border flex items-center gap-2 border-[#1F2329]"
                                            key={i}
                                        >
                                            {e.name}
                                            <MdClose
                                                onClick={(elm) => {
                                                    elm.stopPropagation();
                                                    setZlSelectedList((prev) =>
                                                        prev.filter(
                                                            (item) =>
                                                                item.id !== e.id
                                                        )
                                                    );
                                                }}
                                                className="text-title"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="font-medium text-sm mt-4">
                                Số lần phản hồi
                            </div>

                            <RadioGroup
                                defaultValue={replyType}
                                onValueChange={(value) => {
                                    setReplyType(value);
                                }}
                            >
                                <div className="flex items-center mt-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                            value={2}
                                            id="option-one"
                                        />
                                        <Label htmlFor={2}>Luôn luôn</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                            value={1}
                                            id="option-one"
                                        />
                                        <Label htmlFor={1}>Chỉ lần đầu</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                            <div className="font-medium text-sm mt-4">
                                Loại chat bot
                            </div>

                            <RadioGroup
                                defaultValue={chatBotType}
                                onValueChange={(value) => {
                                    setChatBotType(value);
                                }}
                            >
                                <div className="flex items-center mt-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                            value={"AI"}
                                            id="option-one"
                                        />
                                        <Label htmlFor={"AI"}>AI</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem
                                            value={"QA"}
                                            id="option-one"
                                        />
                                        <Label htmlFor={"QA"}>Q & A</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="font-medium text-sm mt-4">
                                Nhập kịch bản
                                <span className="text-[#FF0000]">*</span>
                            </div>
                            <Textarea
                                value={prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value);
                                }}
                                placeholder="Hãy trở thành chuyên gia tư vấn trong lĩnh vực bất động sản về dự án..."
                                className="bg-[var(--bg1)] mt-2 flex-1 max-h-full"
                            />
                        </div>
                    </div>

                    <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6 mt-4" />
                    <div className="flex ml-auto items-center gap-3 mt-3 justify-end">
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outline"
                            className="px-6"
                        >
                            Hủy
                        </Button>
                        <Button onClick={handleSubmit} className="px-6">
                            Lưu
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
