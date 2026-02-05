import { BuinessProcessTask } from "@/interfaces/businessProcess";
import { Deal } from "@/lib/interface";
import { getAvatarUrl, getFirstAndLastWord, getGender } from "@/lib/utils";
import {
    Briefcase,
    Cake,
    CreditCard,
    Mail,
    MapPin,
    Mars,
    Phone,
    TagIcon,
    Check,
    X,
} from "lucide-react";
import Avatar from "react-avatar";
import InlineEditableField from "../common/InlineEditableField";

export default function DetailUser({
    deal,
    dealDetail,
    onUpdateFields,
}: {
    deal: Deal;
    dealDetail: BuinessProcessTask;
    onUpdateFields?: (partial: Partial<BuinessProcessTask>) => void;
}) {
    const userName =
        dealDetail.username || dealDetail.customerInfo?.fullName || "";
    const email = dealDetail.email || dealDetail.customerInfo?.email || "";
    const phone = dealDetail.phone || dealDetail.customerInfo?.phone || "";

    return (
        <div className="p-4 text-sm">
            <h4 className="font-medium mb-3">Khách hàng</h4>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Avatar
                        name={getFirstAndLastWord(userName)}
                        round
                        size="16"
                    />
                    <InlineEditableField
                        label="Họ và tên"
                        value={userName}
                        onSave={(v) => onUpdateFields?.({ username: v })}
                        labelWidthClassName="w-[90px]"
                    />
                </div>
                <InlineEditableField
                    icon={<Mail className="size-4 text-muted-foreground" />}
                    label="Email"
                    value={email}
                    type="email"
                    onSave={(v) => onUpdateFields?.({ email: v })}
                    labelWidthClassName="w-[90px]"
                />
                <InlineEditableField
                    icon={<Phone className="size-4 text-muted-foreground" />}
                    label="Số điện thoại"
                    value={phone}
                    type="tel"
                    onSave={(v) => onUpdateFields?.({ phone: v })}
                    labelWidthClassName="w-[90px]"
                />
                <div className="flex items-center gap-2">
                    <TagIcon className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-[90px]">Nhãn</span>
                    <div className="flex gap-1"></div>
                </div>
                <div className="flex items-center gap-2">
                    <Mars className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-[90px]">
                        Giới tính
                    </span>
                    <span>
                        {getGender(dealDetail.customerInfo?.gender || 0)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Cake className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-[90px]">
                        Sinh nhật
                    </span>
                    <span>{dealDetail.customerInfo?.dob}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Briefcase className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-[90px]">
                        Nghề nghiệp
                    </span>
                    <span>{dealDetail.customerInfo?.work}</span>
                </div>
                <div className="flex items-center gap-2">
                    <CreditCard className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-[90px]">CCCD</span>
                    <span>{dealDetail.customerInfo?.physicalId}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-[90px]">
                        Địa điểm
                    </span>
                    <span>{dealDetail.customerInfo?.address}</span>
                </div>
                {/* <div className="flex items-center gap-2">
                    <Smartphone className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-[90px]">
                        Thiết bị
                    </span>
                    <span>{dealDetail.device}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MessageCircle className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-[90px]">Zalo</span>
                    <span>{dealDetail.zalo}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Facebook className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground w-[90px]">
                        Facebook
                    </span>
                    <span>fb.com/baoquyentram</span>
                </div> */}
            </div>
        </div>
    );
}
