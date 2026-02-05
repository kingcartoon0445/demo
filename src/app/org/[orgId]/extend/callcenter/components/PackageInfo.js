import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";

export const PackageInfo = ({ callcenterStatis, isActive, onActivate, onExtend, onBuy, onMembers, packageType }) => (
    <div className="flex flex-col gap-2">
        <div className="text-[18px] font-medium">Gói dịch vụ</div>
        <div className="w-full flex flex-col gap-2 min-h-20 bg-bg2 rounded-lg p-5">
            <div className="flex items-center justify-between">
                <div className="text-title font-medium text-[20px]">Tổng đài COKA</div>
                <div className="flex flex-col items-end">
                    <div className="text-title font-medium text-[18px]">100.000 Coin / thành viên / tháng</div>
                    <div className="text-land text-[14px] h-[25px]">
                        {isActive && callcenterStatis?.expiryDate && "Hết hạn: " + new Date(callcenterStatis.expiryDate).toLocaleDateString("vi-VN")}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between w-full mt-1">
                {isActive && <div className="flex flex-col w-[48%] text-sm gap-[2px]">
                    <span>Số chỗ khả dụng: {callcenterStatis?.member ?? 0}/{callcenterStatis?.memberLimit ?? 0} </span>
                    <div className="flex items-center gap-3 w-full">
                        <Progress value={isActive ? ((callcenterStatis?.member ?? 0) / (callcenterStatis?.memberLimit ?? 1)) * 100 : 0} className="w-full h-[14px]" />
                        <div className="text-land text-[12px] font-medium cursor-pointer whitespace-nowrap" onClick={onMembers}>Xem chi tiết</div>
                    </div>
                </div>}
                {isActive ? <div className="flex gap-5">
                    <Button onClick={onExtend} variant="outline" className="h-[34px] bg-none!important border-primary text-primary hover:bg-accent hover:text-primary">Gia hạn</Button>
                    {packageType !== "Pro Sales" && (
                        <Button onClick={onBuy} className="h-[34px]">Mua thêm tài khoản người dùng</Button>
                    )}
                </div> : <div className="flex gap-5 ml-auto">
                    <Button onClick={onActivate} className="h-[34px]">Kích hoạt gói tổng đài</Button>
                </div>}
            </div>
            <StackAvatar
                avatars={isActive ? callcenterStatis?.slotMember : []}
                number={callcenterStatis?.member ?? 0}
                onClick={onMembers}
            />
        </div>
    </div>

);

const StackAvatar = ({ avatars, number, onClick }) => {
    if (!avatars || avatars.length === 0) {
        return (
            <div className="text-sm text-title font-medium">
                Chưa có thành viên nào
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <div className="flex -space-x-2 overflow-hidden p-1 cursor-pointer">
                {(avatars || []).slice(0, 3).map((avatar, index) => (
                    <Avatar
                        key={index}
                        name={getFirstAndLastWord(avatar?.fullName || '')}
                        src={getAvatarUrl(avatar?.avatar)}
                        size="33"
                        round
                        className="border border-primary object-cover"
                    />
                ))}
            </div>
            {(number || 0) > 3 && (
                <div className="text-sm text-title font-medium cursor-pointer" onClick={onClick}>
                    +{(number || 0) - 3} thành viên
                </div>
            )}
        </div>
    );
};

