import Avatar from "react-avatar";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

interface TokenInfo {
    isValid: boolean;
    expiresAt: string;
    hasRequiredPermissions: boolean;
    errorMessage: string | null;
}

interface ChannelCardProps {
    channel: {
        id: string;
        name?: string;
        avatar?: string;
        tokenInfo?: TokenInfo | null;
    };
    isChecking: boolean;
    onCheckPermission: (channelId: string) => void;
}

export function ChannelCard({
    channel,
    isChecking,
    onCheckPermission,
}: ChannelCardProps) {
    const tokenInfo = channel.tokenInfo;
    const showWarning = !tokenInfo;
    const showPermissionError = tokenInfo && !tokenInfo.hasRequiredPermissions;

    // Check if token is expiring soon (within 14 days)
    let showExpiryWarning = false;
    let daysUntilExpiry = 0;
    if (tokenInfo?.expiresAt) {
        const expiryDate = new Date(tokenInfo.expiresAt);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        showExpiryWarning = daysUntilExpiry > 0 && daysUntilExpiry <= 14;
    }

    return (
        <div className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            {channel.avatar ? (
                <img
                    src={channel.avatar}
                    alt={channel.name}
                    className="h-8 w-8 rounded-full object-cover"
                />
            ) : (
                <Avatar name={channel.name || channel.id} size="32" round />
            )}
            <span className="text-sm font-medium">
                {channel.name || channel.id}
            </span>

            {/* Warning icon for no tokenInfo */}
            {showWarning && (
                <TooltipProvider>
                    <Tooltip content="Chưa kiểm tra các quyền cần thiết">
                        <span className="material-icons-outlined text-yellow-500 text-sm cursor-help">
                            warning
                        </span>
                    </Tooltip>
                </TooltipProvider>
            )}

            {/* Warning for hasRequiredPermissions = false */}
            {showPermissionError && (
                <TooltipProvider>
                    <Tooltip content="Vui lòng kết nối lại trang để cập nhật các quyền cần thiết">
                        <span className="material-icons-outlined text-red-500 text-sm cursor-help">
                            error
                        </span>
                    </Tooltip>
                </TooltipProvider>
            )}

            {/* Warning for token expiring soon */}
            {showExpiryWarning && (
                <TooltipProvider>
                    <Tooltip
                        content={`Token sắp hết hạn (còn ${daysUntilExpiry} ngày)`}
                    >
                        <span className="material-icons-outlined text-orange-500 text-sm cursor-help">
                            schedule
                        </span>
                    </Tooltip>
                </TooltipProvider>
            )}

            {/* Check permission button */}
            {(showWarning || showPermissionError) && (
                <TooltipProvider>
                    <Tooltip content="Kiểm tra quyền" side="top">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCheckPermission(channel.id);
                            }}
                            disabled={isChecking}
                            className="absolute -top-1 -right-1 
                                    h-5 w-5 p-1
                                    flex items-center justify-center
                                    rounded-full bg-blue-500 hover:bg-blue-600 
                                    disabled:bg-blue-300 
                                    text-white shadow-sm 
                                    transition-all opacity-70 hover:opacity-100 hover:scale-110"
                        >
                            <span
                                className={`material-icons-outlined ${
                                    isChecking ? "animate-spin" : ""
                                }`}
                                style={{
                                    fontSize: "12px",
                                    lineHeight: "1",
                                }}
                            >
                                {isChecking ? "refresh" : "shield"}
                            </span>
                        </button>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}
