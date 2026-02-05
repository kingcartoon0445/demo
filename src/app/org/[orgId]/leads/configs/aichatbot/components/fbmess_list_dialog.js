import {
    connectFacebookLead,
    getFacebookMessageConnection,
    getFacebookPages,
} from "@/api/leadV2";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/lib/utils";
import { fbLogin } from "@/lib/fbSdk";
import FacebookPageSelectionModal from "../../form/components/facebook_page_selection_modal";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";

export function FbbMessListDialog({
    open,
    setOpen,
    selectedList,
    setSelectedList,
    orgId,
}) {
    const [fbMessList, setFbMessList] = useState();
    const [isConnecting, setIsConnecting] = useState(false);
    const [showPageSelection, setShowPageSelection] = useState(false);
    const [facebookPages, setFacebookPages] = useState([]);
    const [userAccessToken, setUserAccessToken] = useState("");

    const refreshList = () => {
        getFacebookMessageConnection(orgId).then((res) => {
            if (res?.code == 0) {
                setFbMessList(res.content);
            }
        });
    };

    useEffect(() => {
        if (!open) return;
        refreshList();
    }, [open]);

    const handleConnectPages = (selectedPages, workspaceId) => {
        setIsConnecting(true);

        const accessTokens = selectedPages.map((page) => page.access_token);

        const connectPromise = connectFacebookLead(orgId, {
            accessTokens,
            workspaceId: workspaceId || "",
        }).then((res) => {
            if (res?.message) {
                throw new Error(res.message);
            }
            if (res.status && res.status !== 200) {
                throw new Error(res.message);
            }
            if (res.code && res.code !== 0) {
                throw new Error(res.message);
            }
            return res;
        });

        toast.promise(
            connectPromise,
            {
                loading: "Đang kết nối các trang đã chọn...",
                success: "Kết nối Facebook Lead thành công!",
                error: (err) => `Lỗi kết nối: ${err.message || ""}`,
            },
            { position: "top-center" },
        );

        connectPromise
            .then(() => {
                setIsConnecting(false);
                setShowPageSelection(false);
                setFacebookPages([]);
                setUserAccessToken("");
                refreshList();
            })
            .catch(() => {
                setIsConnecting(false);
            });
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className={"overflow-y-auto max-h-[550px] gap-0 w-[450px]"}
            >
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="font-medium text-base mb-2">
                            Chọn trang kết nối
                        </DialogTitle>
                        <Button
                            onClick={async () => {
                                setIsConnecting(true);
                                try {
                                    const data = await fbLogin(
                                        "email,openid,pages_show_list,leads_retrieval,pages_read_engagement,pages_manage_metadata,pages_read_user_content,pages_manage_engagement,public_profile",
                                    );
                                    if (!data || data.status !== "connected") {
                                        toast.error(
                                            "Đăng nhập Facebook thất bại hoặc bị hủy",
                                            { position: "top-center" },
                                        );
                                        return;
                                    }
                                    const { userID, accessToken } =
                                        data.authResponse;
                                    setUserAccessToken(accessToken);
                                    try {
                                        toast.loading(
                                            "Đang lấy danh sách trang Facebook...",
                                            {
                                                position: "top-center",
                                                id: "loading-pages-mess",
                                            },
                                        );
                                        const pagesResponse =
                                            await getFacebookPages(
                                                userID,
                                                accessToken,
                                            );
                                        toast.dismiss("loading-pages-mess");
                                        if (
                                            pagesResponse?.data &&
                                            pagesResponse.data.length > 0
                                        ) {
                                            setFacebookPages(
                                                pagesResponse.data,
                                            );
                                            setShowPageSelection(true);
                                        } else {
                                            toast.error(
                                                "Không tìm thấy trang Facebook nào hoặc bạn chưa cấp quyền quản lý trang",
                                                { position: "top-center" },
                                            );
                                        }
                                    } catch (error) {
                                        toast.dismiss("loading-pages-mess");
                                        console.error(
                                            "Error fetching Facebook pages:",
                                            error,
                                        );
                                        toast.error(
                                            "Có lỗi xảy ra khi lấy danh sách trang Facebook",
                                            { position: "top-center" },
                                        );
                                    }
                                } catch (error) {
                                    const message = String(
                                        error?.message || error,
                                    );
                                    if (
                                        message
                                            .toLowerCase()
                                            .includes("oauth") &&
                                        message
                                            .toLowerCase()
                                            .includes("rate limit")
                                    ) {
                                        toast.error(
                                            "Yêu cầu đăng nhập bị giới hạn. Vui lòng thử lại sau.",
                                            { position: "top-center" },
                                        );
                                    } else {
                                        toast.error(
                                            "Có lỗi xảy ra khi đăng nhập Facebook",
                                            { position: "top-center" },
                                        );
                                    }
                                    console.error(
                                        "Facebook login error:",
                                        error,
                                    );
                                } finally {
                                    setIsConnecting(false);
                                }
                            }}
                            className="ml-4"
                            disabled={isConnecting}
                        >
                            {isConnecting ? "Đang kết nối..." : "Kết nối mới"}
                        </Button>
                    </div>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>
                <div className="flex flex-col max-h-[500px] overflow-y-auto w-full mt-2">
                    {fbMessList?.map((e, i) => (
                        <div
                            key={i}
                            onClick={() => {
                                const exists = selectedList?.some(
                                    (item) => item.id == e.id,
                                );
                                if (exists) {
                                    setSelectedList((prev) =>
                                        prev.filter((item) => item.id !== e.id),
                                    );
                                } else {
                                    setSelectedList((prev) => [
                                        ...(prev || []),
                                        e,
                                    ]);
                                }
                            }}
                            className="flex items-center gap-4 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground p-2 rounded-lg"
                        >
                            <Avatar
                                name={e.name}
                                src={getAvatarUrl(e.avatar)}
                                size="40"
                                round
                            />
                            <div className="flex flex-col leading-[1.4]">
                                <div className="text-title text-base font-medium">
                                    {e.name}
                                </div>
                            </div>
                            <Checkbox
                                checked={selectedList?.some(
                                    (item) => item.id == e.id,
                                )}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedList((prev) => [...prev, e]);
                                    } else {
                                        setSelectedList((prev) =>
                                            prev.filter(
                                                (item) => item.id !== e.id,
                                            ),
                                        );
                                    }
                                }}
                                className="ml-auto"
                            />
                        </div>
                    ))}
                </div>
            </DialogContent>
            <FacebookPageSelectionModal
                open={showPageSelection}
                setOpen={setShowPageSelection}
                pages={facebookPages}
                orgId={orgId}
                onConnect={handleConnectPages}
                isConnecting={isConnecting}
            />
        </Dialog>
    );
}
