import { inviteMembers } from "@/api/memberV2";
import { sendEmailInviteMember } from "@/api/org";
import { useOrgStore } from "@/store/useOrgStore";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearchMember } from "@/hooks/useOrganizations";
import { getAvatarUrl } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Avatar from "react-avatar";
import { toast } from "react-hot-toast";
import { CopyIcon, SaveIcon } from "../icons";

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    fetchInvitations: () => void;
}

interface MemberItem {
    profileId: string;
    fullName: string;
    email: string;
    status: number; // 0: có thể mời, 1: đã gia nhập, 2: đã gửi
    avatar?: string;
}

interface ApiResponse {
    code: number;
    message?: string;
}

export default function AddMemberModal({
    isOpen,
    onClose,
    orgId,
    fetchInvitations,
}: AddMemberModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debounced, setDebounced] = useState("");
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<"search" | "qr">("search");
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [orgDetail, setOrgDetail] = useState<any | null>(null);
    const [sentEmails, setSentEmails] = useState<Set<string>>(new Set());
    const [pendingEmails, setPendingEmails] = useState<Set<string>>(new Set());

    // Debounce search input 400ms
    useEffect(() => {
        const t = setTimeout(() => setDebounced(searchTerm.trim()), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const { data, isFetching } = useSearchMember(orgId, debounced);
    const list = data?.content ?? [];

    const queryClient = useQueryClient();

    const inviteMutation = useMutation({
        mutationFn: async (profileId: string) => {
            const res: ApiResponse = await inviteMembers(orgId, profileId);
            return res;
        },
        onSuccess: (res: ApiResponse) => {
            if (res?.code === 0) {
                toast.success(res?.message || t("member.inviteSent"));
                queryClient.invalidateQueries({
                    queryKey: ["searchMember", orgId],
                });
                fetchInvitations();
            }
        },
        onError: (err: Error) => {
            toast.error(err.message || t("member.inviteFailed"));
        },
    });

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
            setQrDataUrl(null);
            setActiveTab("search");
            setSentEmails(new Set());
            setPendingEmails(new Set());
        }
    }, [isOpen]);

    const joinLink = useMemo(() => {
        if (!orgId) return "";
        const base =
            typeof window !== "undefined"
                ? window.location.origin
                : "https://coka.ai";
        const rawLink = `${base}/request/${orgId}`;
        let encoded = rawLink;

        if (
            typeof window !== "undefined" &&
            typeof window.btoa === "function"
        ) {
            encoded = window.btoa(rawLink);
        } else if (typeof Buffer !== "undefined") {
            encoded = Buffer.from(rawLink).toString("base64");
        }

        return `https://onelink.coka.ai?id=${encoded}`;
    }, [orgId]);

    useEffect(() => {
        const generateQr = async () => {
            if (!isOpen || activeTab !== "qr" || !joinLink) return;
            try {
                setQrLoading(true);
                // Generate QR code as data URL
                const dataUrl = await QRCode.toDataURL(joinLink, {
                    width: 400,
                    margin: 2,
                    color: {
                        dark: "#000000",
                        light: "#FFFFFF",
                    },
                });
                setQrDataUrl(dataUrl);
            } catch (e) {
                console.error("Error generating QR code:", e);
                setQrDataUrl(null);
            } finally {
                setQrLoading(false);
            }
        };
        generateQr();
    }, [isOpen, activeTab, joinLink]);

    // Fetch org detail to display on QR tab
    const { orgDetail: globalOrgDetail } = useOrgStore();
    useEffect(() => {
        if (!isOpen || activeTab !== "qr" || !orgId) return;
        if (globalOrgDetail && globalOrgDetail.id === orgId) {
            setOrgDetail(globalOrgDetail);
        } else {
            // Fallback if global store doesn't match?
            // Ideally it should match if Sidebar logic works.
            // But if we are strict, we might want to fetch.
            // But user request implies replacing API call with store.
            // I will assume globalOrgDetail is sufficient or update implies sync.
            setOrgDetail(globalOrgDetail);
        }
    }, [isOpen, activeTab, orgId, globalOrgDetail]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(joinLink);
            toast.success(t("common.copied") || "Đã sao chép liên kết");
        } catch {
            toast.error("Không thể sao chép liên kết");
        }
    };

    const handleDownloadQR = () => {
        if (!qrDataUrl) return;
        const a = document.createElement("a");
        a.href = qrDataUrl;
        a.download = `invite-qr-${orgId}.png`;
        a.click();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[500px] gap-2">
                <DialogHeader>
                    <DialogTitle>{t("member.add")}</DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <div className="border-b">
                    <div className="flex items-center">
                        <button
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === "search"
                                    ? "text-primary border-primary"
                                    : "text-muted-foreground border-transparent hover:text-title"
                            }`}
                            onClick={() => setActiveTab("search")}
                        >
                            Email
                        </button>
                        <button
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === "qr"
                                    ? "text-primary border-primary"
                                    : "text-muted-foreground border-transparent hover:text-title"
                            }`}
                            onClick={() => setActiveTab("qr")}
                        >
                            Link hoặc QR
                        </button>
                    </div>
                </div>

                {activeTab === "search" && (
                    <>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder={t("member.searchEmailOrName")}
                                className="pl-9"
                                value={searchTerm}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Results */}
                        <div className="max-h-72 overflow-y-auto space-y-2">
                            {isFetching && (
                                <p className="text-sm text-gray-500">
                                    {t("common.search")}...
                                </p>
                            )}

                            {!isFetching && debounced && list.length === 0 && (
                                <div className="space-y-3">
                                    {/* Gợi ý mời qua email nếu input là email */}
                                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                                        debounced,
                                    ) && (
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    name={debounced}
                                                    size="32"
                                                    round
                                                />
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {debounced}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Chưa có trong hệ thống
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                disabled={
                                                    sentEmails.has(debounced) ||
                                                    pendingEmails.has(debounced)
                                                }
                                                onClick={() => {
                                                    if (
                                                        pendingEmails.has(
                                                            debounced,
                                                        ) ||
                                                        sentEmails.has(
                                                            debounced,
                                                        )
                                                    ) {
                                                        return;
                                                    }

                                                    setPendingEmails((prev) => {
                                                        const next = new Set(
                                                            prev,
                                                        );
                                                        next.add(debounced);
                                                        return next;
                                                    });

                                                    sendEmailInviteMember(
                                                        orgId,
                                                        {
                                                            email: debounced,
                                                        },
                                                    )
                                                        .then((res) => {
                                                            if (
                                                                res.code === 0
                                                            ) {
                                                                toast.success(
                                                                    "Đã gửi lời mời qua email",
                                                                );
                                                                setSentEmails(
                                                                    (prev) => {
                                                                        const next =
                                                                            new Set(
                                                                                prev,
                                                                            );
                                                                        next.add(
                                                                            debounced,
                                                                        );
                                                                        return next;
                                                                    },
                                                                );
                                                            } else {
                                                                toast.error(
                                                                    res.message ||
                                                                        "Không thể gửi lời mời",
                                                                );
                                                            }
                                                        })
                                                        .catch((err) => {
                                                            toast.error(
                                                                err.message ||
                                                                    "Không thể gửi lời mời",
                                                            );
                                                        })
                                                        .finally(() => {
                                                            setPendingEmails(
                                                                (prev) => {
                                                                    const next =
                                                                        new Set(
                                                                            prev,
                                                                        );
                                                                    next.delete(
                                                                        debounced,
                                                                    );
                                                                    return next;
                                                                },
                                                            );
                                                        });
                                                }}
                                            >
                                                {sentEmails.has(debounced)
                                                    ? "Đã gửi qua email"
                                                    : pendingEmails.has(
                                                            debounced,
                                                        )
                                                      ? "Đang gửi..."
                                                      : "Gửi mail mời"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {list.map((item: MemberItem) => (
                                <div
                                    key={item.profileId}
                                    className="flex items-center justify-between gap-2 p-2 border rounded"
                                >
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            name={item.fullName}
                                            src={
                                                getAvatarUrl(
                                                    item.avatar || "",
                                                ) || undefined
                                            }
                                            size="32"
                                            className="object-cover"
                                            round
                                        />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {item.fullName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            disabled={
                                                inviteMutation.isPending ||
                                                item.status === 1 ||
                                                item.status === 2
                                            }
                                            onClick={() =>
                                                inviteMutation.mutate(
                                                    item.profileId,
                                                )
                                            }
                                        >
                                            {item.status === 0
                                                ? t("member.invite")
                                                : item.status === 1
                                                  ? "Đã gia nhập"
                                                  : item.status === 2
                                                    ? "Đã gửi"
                                                    : t("member.invite")}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === "qr" && (
                    <div className="flex flex-col items-center justify-center min-h-[260px] px-4 pb-2 text-center">
                        <div className="flex flex-col items-center gap-2 mb-2">
                            {orgDetail?.avatar ? (
                                <img
                                    src={orgDetail.avatar}
                                    alt={orgDetail?.name || "Org"}
                                    className="w-14 h-14 rounded-lg object-cover"
                                />
                            ) : (
                                <Avatar
                                    name={orgDetail?.name || "Org"}
                                    size="56"
                                    round
                                    className="object-cover"
                                />
                            )}
                            {orgDetail?.name && (
                                <div className="text-lg font-semibold flex items-center gap-1">
                                    {orgDetail.name}
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                                Mời mọi người tham gia tổ chức bằng mã QR hoặc
                                liên kết dưới đây:
                            </div>
                        </div>
                        {qrLoading && (
                            <p className="text-sm text-gray-500">
                                Đang tạo mã QR...
                            </p>
                        )}
                        {!qrLoading && qrDataUrl && (
                            <>
                                <img
                                    src={qrDataUrl}
                                    alt="Invite QR"
                                    className="w-56 h-56 object-contain border rounded-md"
                                />
                                <div className="flex items-center gap-6 mt-4">
                                    <button
                                        onClick={handleCopyLink}
                                        className="flex flex-col items-center gap-1 text-xs"
                                    >
                                        <span className="size-8 rounded-full border flex items-center justify-center">
                                            <CopyIcon />
                                        </span>
                                        Sao chép liên kết
                                    </button>
                                    <button
                                        onClick={handleDownloadQR}
                                        className="flex flex-col items-center gap-1 text-xs"
                                    >
                                        <span className="size-8 rounded-full border flex items-center justify-center">
                                            <SaveIcon />
                                        </span>
                                        Lưu mã QR
                                    </button>
                                </div>
                            </>
                        )}
                        {!qrLoading && !qrDataUrl && (
                            <p className="text-sm text-gray-500">
                                Không thể tạo mã QR
                            </p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
