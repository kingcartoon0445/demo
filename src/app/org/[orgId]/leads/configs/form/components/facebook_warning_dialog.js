import { connectFacebookLead, getFacebookPages } from "@/api/leadV2";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { fbLogin } from "@/lib/fbSdk";
import { useState } from "react";
import toast from "react-hot-toast";
import FacebookPageSelectionModal from "./facebook_page_selection_modal";

export default function FacebookWarningDialog({
    open,
    setOpen,
    orgId,
    workspace,
    onSuccess,
    refreshFbList,
}) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [showPageSelection, setShowPageSelection] = useState(false);
    const [facebookPages, setFacebookPages] = useState([]);
    const [userAccessToken, setUserAccessToken] = useState("");

    const handleConnect = () => {
        setIsConnecting(true);

        fbLogin(
            "email,openid,pages_show_list,pages_messaging,instagram_basic,leads_retrieval,instagram_manage_messages,pages_read_engagement,pages_manage_metadata,pages_read_user_content,pages_manage_engagement,public_profile,pages_manage_posts"
        )
            .then(async (data) => {
                // Kiểm tra nếu user hủy login hoặc không cấp quyền
                if (data.status !== "connected") {
                    setIsConnecting(false);
                    toast.error("Đăng nhập Facebook thất bại hoặc bị hủy", {
                        position: "top-center",
                    });
                    return;
                }

                const { userID, accessToken } = data.authResponse;
                setUserAccessToken(accessToken);

                try {
                    // Lấy danh sách pages từ Facebook Graph API
                    toast.loading("Đang lấy danh sách trang Facebook...", {
                        position: "top-center",
                        id: "loading-pages",
                    });

                    const pagesResponse = await getFacebookPages(
                        userID,
                        accessToken
                    );

                    toast.dismiss("loading-pages");

                    if (pagesResponse?.data && pagesResponse.data.length > 0) {
                        setFacebookPages(pagesResponse.data);
                        setIsConnecting(false);
                        setOpen(false);
                        setShowPageSelection(true);
                    } else {
                        setIsConnecting(false);
                        toast.error(
                            "Không tìm thấy trang Facebook nào hoặc bạn chưa cấp quyền quản lý trang",
                            {
                                position: "top-center",
                            }
                        );
                    }
                } catch (error) {
                    setIsConnecting(false);
                    toast.dismiss("loading-pages");
                    console.error("Error fetching Facebook pages:", error);
                    toast.error(
                        "Có lỗi xảy ra khi lấy danh sách trang Facebook",
                        {
                            position: "top-center",
                        }
                    );
                }
            })
            .catch((error) => {
                setIsConnecting(false);
                console.error("Facebook login error:", error);
                toast.error("Có lỗi xảy ra khi đăng nhập Facebook", {
                    position: "top-center",
                });
            });
    };

    const handleConnectPages = (selectedPages, workspaceId) => {
        setIsConnecting(true);
        const accessTokens = selectedPages.map((page) => page.access_token);

        const connectPromise = connectFacebookLead(orgId, {
            accessTokens,
            workspaceId: workspaceId || "",
        }).then((res) => {
            if (res?.message) {
                // Throw error để toast.promise catch được
                throw new Error(res.message);
            }
            if (res.status && res.status !== 200) {
                throw new Error(res.message);
            }
            if (res.code && res.code !== 0) {
                throw new Error(res.message);
            }
            return res; // Return success response
        });

        toast.promise(
            connectPromise,
            {
                loading: "Đang kết nối các trang đã chọn...",
                success: "Kết nối trang Facebook thành công!",
                error: (err) => `Lỗi kết nối: ${err.message || ""}`,
            },
            { position: "top-center" }
        );

        connectPromise
            .then(() => {
                setIsConnecting(false);
                setShowPageSelection(false);

                // Reset states
                setFacebookPages([]);
                setUserAccessToken("");

                // Callback success
                if (refreshFbList) refreshFbList();
                if (onSuccess) onSuccess();
            })
            .catch(() => {
                setIsConnecting(false);
            });
    };

    return (
        <>
            <FacebookPageSelectionModal
                open={showPageSelection}
                setOpen={setShowPageSelection}
                pages={facebookPages}
                orgId={orgId}
                onConnect={handleConnectPages}
                isConnecting={isConnecting}
            />
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">
                            Cảnh báo kết nối Facebook
                        </DialogTitle>
                        <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6 mt-4" />
                    </DialogHeader>

                    <div className="py-4">
                        <DialogDescription className="text-base text-center mb-4">
                            Khi bạn kết nối với Facebook, hãy lưu ý điều quan
                            trọng sau:
                        </DialogDescription>

                        <div className="space-y-3 text-sm">
                            <p className="font-medium text-red-500">
                                KHÔNG BỎ CHỌN các fanpage đã kết nối trước đó!
                            </p>
                            <p>
                                • Khi Facebook hiển thị danh sách fanpage để kết
                                nối, hãy đảm bảo KHÔNG bỏ chọn các fanpage đã
                                được kết nối trước đó ở các tổ chức hoặc nhóm
                                làm việc khác.
                            </p>
                            <p>
                                • Việc bỏ chọn sẽ làm mất kết nối của các
                                fanpage đó với hệ thống, dẫn đến mất dữ liệu
                                lead từ các fanpage này.
                            </p>
                            <p>
                                • Bạn có thể gỡ các kết nối không mong muốn ở tổ
                                chức hoặc không gian làm việc hiện tại thông qua
                                giao diện quản lý kết nối trên Coka.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="flex-1"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConnect}
                            className="flex-1 bg-primary hover:bg-primary/90"
                            disabled={isConnecting}
                        >
                            {isConnecting
                                ? "Đang kết nối..."
                                : "Tôi đã hiểu, tiếp tục kết nối"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
