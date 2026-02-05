"use client";
import {
    acceptInvitation,
    acceptRequest,
    cancelRequest,
    getRequestList,
    rejectInvitation,
    rejectRequest,
    searchOrganization,
    sendRequest,
} from "@/api/memberV2";
import { useOrgList } from "@/hooks/orgs_data";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { IoMdSearch } from "react-icons/io";
import { useDebounce } from "use-debounce";
import { create } from "zustand";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
export const useJoinOrg = create((set) => ({
    openJoinOrg: false,
    openRequestJoin: false,
    setOpenRequestJoin: (openRequestJoin) => set({ openRequestJoin }),
    setOpenJoinOrg: (openJoinOrg) => set({ openJoinOrg }),
}));

// Helper function để lấy currentOrg từ localStorage hoặc URL hiện tại
const getCurrentOrg = () => {
    if (typeof window === "undefined") {
        return null;
    }

    const storedOrgId = localStorage.getItem("currentOrgId");
    if (storedOrgId) {
        return storedOrgId;
    }

    // Fallback: parse orgId từ URL (dạng /org/{orgId}/...)
    const match = window.location.pathname.match(/\/org\/([^/]+)/);
    if (match && match[1]) {
        return match[1];
    }

    return null;
};

export function JoinOrg({ open, setOpen, defaultTab = "join" }) {
    const [orgList, setOrgList] = useState();
    const [inviteList, setInviteList] = useState();
    const [requestList, setRequestList] = useState();
    const { refreshOrgList, setRefreshOrgList } = useOrgList();
    const [searchOrg, setSearchOrg] = useState("");
    const [debouncedSearchMember] = useDebounce(searchOrg, 500);
    // Thêm state mới để quản lý tab
    const [activeTab, setActiveTab] = useState(defaultTab);
    // State để lưu currentOrg và cập nhật khi cần
    const [currentOrg, setCurrentOrg] = useState(() => getCurrentOrg());
    const [hasWarnedNoOrg, setHasWarnedNoOrg] = useState(false);

    const fetchOrganizations = async (searchText) => {
        setOrgList(undefined);
        try {
            const res = await searchOrganization({
                searchText,
                limit: 10,
                offset: 0,
            });
            if (res?.code !== 0) {
                return;
            }
            setOrgList(res.content);
        } catch (err) {
            toast.error("Có lỗi xảy ra khi tải dữ liệu");
        }
    };

    useEffect(() => {
        if (searchOrg.length >= 3) {
            fetchOrganizations(searchOrg);
        }
    }, [debouncedSearchMember]);

    // function để refresh thủ công
    const handleRefresh = () => {
        if (searchOrg.length >= 3) {
            fetchOrganizations(searchOrg);
        }
    };

    // Hàm lấy danh sách tổ chức đã gửi lời mời (REQUEST)
    const fetchRequestList = async (orgId) => {
        try {
            const res = await getRequestList(orgId, "REQUEST");
            if (res?.code !== 0) {
                return;
            }
            setRequestList(res.content);
        } catch (err) {
            toast.error("Có lỗi xảy ra khi tải danh sách request");
        }
    };

    // Hàm lấy danh sách lời mời đến (INVITE)
    const fetchInviteList = async (orgId) => {
        try {
            const res = await getRequestList(orgId, "INVITE");
            if (res?.code !== 0) {
                return;
            }
            setInviteList(res.content);
        } catch (err) {
            toast.error("Có lỗi xảy ra khi tải danh sách invite");
        }
    };

    // Cập nhật currentOrg khi dialog mở hoặc khi cần
    useEffect(() => {
        if (open) {
            const orgId = getCurrentOrg();
            setCurrentOrg(orgId);
            setHasWarnedNoOrg(false);
        }
    }, [open]);

    // Hàm refresh chung
    const handleRefreshRequest = () => {
        // Đọc lại từ localStorage mỗi lần gọi để đảm bảo có giá trị mới nhất
        const orgId = getCurrentOrg();
        if (!orgId) {
            if (!hasWarnedNoOrg) {
                toast.error("Không tìm thấy tổ chức hiện tại");
                setHasWarnedNoOrg(true);
            }
            return;
        }
        setHasWarnedNoOrg(false);
        setCurrentOrg(orgId);
        if (activeTab === "invited") {
            fetchRequestList(orgId);
        } else if (activeTab === "request") {
            fetchInviteList(orgId);
        }
    };

    // Tự động gọi khi tab hoặc dialog mở
    useEffect(() => {
        if (!open) return;

        // Khi ở tab tìm kiếm tổ chức thì chỉ xử lý tìm kiếm
        if (activeTab === "join") {
            handleRefresh();
            return;
        }
        // Khi chuyển sang các tab "Lời mời" hoặc "Đã gửi" thì tải danh sách tương ứng
        handleRefreshRequest();
    }, [activeTab, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="grid sm:max-w-xl h-auto pt-4 transition-all">
                <DialogHeader>
                    <DialogTitle
                        className={
                            "font-medium text-[20px] text-title flex items-center justify-between mb-3"
                        }
                    >
                        Tham gia tổ chức
                    </DialogTitle>
                </DialogHeader>
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="join">Tham gia tổ chức</TabsTrigger>
                        <TabsTrigger value="request">Lời mời</TabsTrigger>
                        <TabsTrigger value="invited">Đã gửi</TabsTrigger>
                    </TabsList>
                    <TabsContent value="join">
                        <div className={`relative flex items-center w-full`}>
                            <div className="h-auto absolute left-4 top-1/2 -translate-y-1/2 transform ">
                                <IoMdSearch className="text-2xl" />
                            </div>
                            <Input
                                defaultValue={searchOrg}
                                aria-describedby="search-orgs"
                                onChangeCapture={(e) => {
                                    setSearchOrg(e.currentTarget.value);
                                }}
                                placeholder="Nhập tên tổ chức"
                                type="search"
                                className={`bg-bg1 border-none h-[40px] pl-12 rounded-xl mt-1`}
                            />
                        </div>
                        <ScrollArea className="flex flex-col mt-4 h-[500px]">
                            {searchOrg.length >= 3 ? (
                                orgList && orgList.length > 0 ? (
                                    orgList.map((e, i) => (
                                        <OrgItem
                                            key={i}
                                            item={e}
                                            refresh={handleRefresh}
                                        />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <p className="text-gray-500">
                                            Không tìm thấy tổ chức phù hợp
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <p className="text-gray-500">
                                        Nhập tên tổ chức để tìm kiếm (tối thiểu
                                        3 ký tự)
                                    </p>
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="request">
                        <ScrollArea className="flex flex-col mt-4 h-[548px]">
                            {inviteList && inviteList.length > 0 ? (
                                inviteList.map((e, i) => (
                                    <InvitedItem
                                        key={i}
                                        item={e}
                                        isRefresh={handleRefreshRequest}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <p className="text-gray-500">
                                        Chưa có lời mời nào được nhận
                                    </p>
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="invited">
                        <ScrollArea className="flex flex-col mt-4 h-[548px]">
                            {requestList && requestList.length > 0 ? (
                                requestList.map((e, i) => (
                                    <SendRequestItem
                                        key={i}
                                        item={e}
                                        isRefresh={handleRefreshRequest}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <p className="text-gray-500">
                                        Chưa có lời mời nào được gửi
                                    </p>
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

const InvitedItem = ({ item, isRefresh }) => {
    const [isAcceptLoading, setIsAcceptLoading] = useState(false);
    const [isCancelLoading, setIsCancelLoading] = useState(false);
    const queryClient = useQueryClient();
    return (
        <div className="flex items-center gap-2 mt-3">
            <Avatar
                name={getFirstAndLastWord(item.organization.name)}
                src={getAvatarUrl(item.organization.avatar)}
                round
                size="40"
            />
            <div className="flex flex-col">
                <div className="text-title font-medium">
                    {item.organization.name}
                </div>
                <div className="text-xs text-text2">
                    {item.organization.subscription == "PERSONAL"
                        ? "Cá nhân"
                        : "Tổ chức"}
                </div>
            </div>
            <Button
                onClick={() => {
                    setIsAcceptLoading(true);
                    acceptInvitation(item.organizationId, item.id).then(
                        (res) => {
                            setIsAcceptLoading(false);
                            toast.success(
                                `Gia nhập thành công tổ chức ${item.organization.name}`
                            );
                            isRefresh((prev) => !prev);
                            queryClient.invalidateQueries({
                                queryKey: ["organizations"],
                            });
                        }
                    );
                }}
                className="ml-auto text-xs px-3 h-[30px] gap-1"
            >
                {isAcceptLoading ? (
                    <>
                        <Loader2 className="animate-spin h-[20px]" /> Vui lòng
                        chờ
                    </>
                ) : (
                    "Xác nhận"
                )}
            </Button>
            <Button
                onClick={() => {
                    setIsCancelLoading(true);
                    rejectInvitation(item.organizationId, item.id).then(
                        (res) => {
                            setIsCancelLoading(false);
                            isRefresh((prev) => !prev);
                        }
                    );
                }}
                variant="outline"
                className=" text-xs px-3 h-[30px] gap-1"
            >
                {isCancelLoading ? (
                    <>
                        <Loader2 className="animate-spin h-[20px]" /> Vui lòng
                        chờ
                    </>
                ) : (
                    "Hủy"
                )}
            </Button>
        </div>
    );
};
const OrgItem = ({ item, refresh }) => {
    const [isInvited, setIsInvited] = useState(item?.isRequest);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="flex items-center gap-2 mt-3">
            <Avatar
                name={getFirstAndLastWord(item.name)}
                src={getAvatarUrl(item.avatar)}
                round
                size="40"
            />
            <div className="flex flex-col">
                <div className="text-title font-medium">{item.name}</div>
                <div className="text-xs text-text2">
                    {item.subscription == "PERSONAL" ? "Cá nhân" : "Tổ chức"}
                </div>
            </div>
            {isInvited ? (
                <Button
                    variant="outline"
                    disabled
                    className="ml-auto text-xs rounded-lg h-[30px]"
                >
                    Đang chờ
                </Button>
            ) : (
                <Button
                    onClick={() => {
                        setIsLoading(true);
                        sendRequest(item.organizationId)
                            .then((res) => {
                                setIsLoading(false);
                                if (res?.message)
                                    return toast.error(res.message, {
                                        position: "top-center",
                                    });
                                setIsInvited(true);
                                refresh((prev) => !prev);
                            })
                            .catch((e) => {
                                setIsLoading(false);
                            });
                    }}
                    className="ml-auto text-xs px-3 h-[30px] gap-1"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin h-[20px]" /> Vui
                            lòng chờ
                        </>
                    ) : (
                        "Tham gia"
                    )}
                </Button>
            )}
        </div>
    );
};

const SendRequestItem = ({ item, isRefresh }) => {
    const [isCancelLoading, setIsCancelLoading] = useState(false);
    return (
        <div className="flex items-center gap-2 mt-3 w-full">
            <Avatar
                name={getFirstAndLastWord(item.organization.name)}
                src={getAvatarUrl(item.organization.avatar)}
                round
                size="40"
            />
            <div className="flex flex-col">
                <div className="text-title font-medium">
                    {item.organization.name}
                </div>
                <div className="text-xs text-text2">
                    {item.organization.subscription == "PERSONAL"
                        ? "Cá nhân"
                        : "Tổ chức"}
                </div>
            </div>
            <Button
                className="ml-auto text-xs px-3 h-[30px] gap-1"
                loading={isCancelLoading}
                onClick={() => {
                    setIsCancelLoading(true);
                    // Đọc lại từ localStorage để đảm bảo có giá trị mới nhất
                    const orgId = getCurrentOrg();
                    if (!orgId) {
                        setIsCancelLoading(false);
                        toast.error("Không tìm thấy tổ chức hiện tại");
                        return;
                    }
                    cancelRequest(orgId, item.id).then((res) => {
                        setIsCancelLoading(false);
                        if (res?.message)
                            return toast.error(res.message, {
                                position: "top-center",
                            });
                        isRefresh((prev) => !prev);
                    });
                }}
                variant="outline"
            >
                Hủy yêu cầu
            </Button>
        </div>
    );
};
