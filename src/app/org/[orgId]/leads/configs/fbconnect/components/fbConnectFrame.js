"use client";
import {
    connectFacebookMessage,
    getFacebookMessageConnection,
    getFacebookPages,
} from "@/api/leadV2";
import { Button } from "@/components/ui/button";
import { useFbSubscriptionList } from "@/hooks/facebook_data";
import { fbLogin } from "@/lib/fbSdk";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { MdAdd } from "react-icons/md";
import FacebookPageSelectionModal from "../../form/components/facebook_page_selection_modal";

export default function FBConnectFrame({ orgId }) {
    const { setSubscriptionList } = useFbSubscriptionList();
    const [isConnecting, setIsConnecting] = useState(false);
    const [showPageSelection, setShowPageSelection] = useState(false);
    const [facebookPages, setFacebookPages] = useState([]);
    const [userAccessToken, setUserAccessToken] = useState("");

    const handleConnectPages = (selectedPages, workspaceId) => {
        setIsConnecting(true);

        // Extract access tokens từ selected pages
        const accessTokens = selectedPages.map((page) => page.access_token);

        const connectPromise = connectFacebookMessage(orgId, {
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

                // Refresh subscription list
                getFacebookMessageConnection(orgId).then((res) => {
                    setSubscriptionList(res.content);
                });
            })
            .catch(() => {
                setIsConnecting(false);
            });
    };
    return (
        <div className="flex flex-col w-full items-start p-4">
            <div className="flex items-center text-[22px] font-medium gap-3">
                <Image
                    alt="messenger"
                    src={"/icons/messenger.svg"}
                    width={35}
                    height={35}
                    className="object-contain h-[36px] w-auto"
                />
                Facebook Messenger
            </div>
            <div className="text-[18px] mt-4">
                Chat với khách hàng thông qua Facebook Messenger, trực tiếp ngay
                trên COKA
            </div>
            <Button
                onClick={() => {
                    setIsConnecting(true);

                    fbLogin(
                        "email,openid,pages_show_list,pages_messaging,instagram_basic,leads_retrieval,instagram_manage_messages,pages_read_engagement,pages_manage_metadata,pages_read_user_content,pages_manage_engagement,public_profile,pages_manage_posts"
                    )
                        .then(async (data) => {
                            // Kiểm tra nếu user hủy login hoặc không cấp quyền
                            if (data.status !== "connected") {
                                setIsConnecting(false);
                                toast.error(
                                    "Đăng nhập Facebook thất bại hoặc bị hủy",
                                    {
                                        position: "top-center",
                                    }
                                );
                                return;
                            }

                            const { userID, accessToken } = data.authResponse;
                            setUserAccessToken(accessToken);

                            try {
                                // Lấy danh sách pages từ Facebook Graph API
                                toast.loading(
                                    "Đang lấy danh sách trang Facebook...",
                                    {
                                        position: "top-center",
                                        id: "loading-pages",
                                    }
                                );

                                const pagesResponse = await getFacebookPages(
                                    userID,
                                    accessToken
                                );

                                toast.dismiss("loading-pages");

                                if (
                                    pagesResponse?.data &&
                                    pagesResponse.data.length > 0
                                ) {
                                    setFacebookPages(pagesResponse.data);
                                    setIsConnecting(false);
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
                                console.error(
                                    "Error fetching Facebook pages:",
                                    error
                                );
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
                            toast.error(
                                "Có lỗi xảy ra khi đăng nhập Facebook",
                                {
                                    position: "top-center",
                                }
                            );
                        });
                }}
                className="rounded-xl gap-3 mt-4"
                disabled={isConnecting}
            >
                <MdAdd className="text-xl" />
                {isConnecting ? "Đang kết nối..." : "Kết nối trang"}
            </Button>

            <FacebookPageSelectionModal
                open={showPageSelection}
                setOpen={setShowPageSelection}
                pages={facebookPages}
                orgId={orgId}
                onConnect={handleConnectPages}
                isConnecting={isConnecting}
                showWorkspaceSelector={false}
            />
        </div>
    );
}
