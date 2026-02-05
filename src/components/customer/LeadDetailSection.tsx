"use client";

import { formatDate } from "@/lib/customerDetailTypes";
import { CalendarIcon, Captions, MoreHorizontalIcon } from "lucide-react";
import Image from "next/image";
import { Badge } from "../ui/badge";
import { EditableFieldRow } from "../common/EditableFieldRow";
import EditableTagsValue from "../common/EditableTagsValue";
import EditableAssigneesValue from "../common/EditableAssigneesValue";
import EditableAssigneeValue from "../common/EditableAssigneeValue";
import { useUnlinkToLead } from "@/hooks/useConversation";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import EditableValue from "../common/EditableValue";
import { Assignee } from "@/lib/interface";
import { useLanguage } from "@/contexts/LanguageContext";

interface LeadDetailSectionProps {
    leadDetail: any;
    orgId: string;
    conversationId?: string;
}

export default function LeadDetailSection({
    leadDetail,
    orgId,
    conversationId,
}: LeadDetailSectionProps) {
    const { mutate: unlinkLead } = useUnlinkToLead(orgId, conversationId || "");

    // Tách owner và followers từ assignees
    const owner = leadDetail?.assignees.find(
        (assignee: Assignee) => assignee.type === "OWNER"
    );
    const followers = leadDetail?.assignees.filter(
        (assignee: Assignee) => assignee.type === "FOLLOWER"
    );
    const { t } = useLanguage();

    return (
        <div className="space-y-2">
            {/* Chi tiết */}
            <div className="flex justify-between items-center">
                <h3 className="text-[14px] text-black font-medium">
                    {t("common.detail")}
                </h3>
                {conversationId && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontalIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => unlinkLead()}>
                                <span>Xóa liên kết</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            <EditableFieldRow
                icon={<Captions className="w-5 h-5 text-gray-600" />}
                label={t("common.title")}
            >
                <EditableValue
                    value={leadDetail?.fullName || ""}
                    fieldName="fullName"
                    orgId={orgId}
                    leadId={leadDetail?.id || ""}
                />
            </EditableFieldRow>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <CalendarIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-[14px] text-gray-900">
                        {t("common.createdDate")}
                    </span>
                </div>
                <div className="flex-1 text-right">
                    <span className="text-[14px] text-gray-900">
                        {formatDate(leadDetail?.createdDate || "")}
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <Image
                        src={"/icons/input_circle.svg"}
                        alt="input_circle"
                        width={20}
                        height={20}
                    />
                    <span className="text-[14px] text-gray-900">
                        {t("common.classification")}
                    </span>
                </div>
                <div className="flex-1 text-right">
                    <span className="text-[14px] text-gray-900">
                        {leadDetail?.source || ""}
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <Image
                        src={"/icons/chip_extraction.svg"}
                        alt="chip_extraction"
                        width={20}
                        height={20}
                    />
                    <span className="text-[14px] text-gray-900">
                        {t("common.source")}
                    </span>
                </div>
                <div className="flex-1 text-right">
                    <span className="text-[14px] text-gray-900">
                        {leadDetail?.utmSource &&
                        leadDetail?.utmSource.length > 0
                            ? leadDetail?.utmSource.map((source: string) => (
                                  <Badge key={source}>{source}</Badge>
                              ))
                            : ""}
                    </span>
                </div>
            </div>
            <EditableFieldRow
                icon={
                    <Image
                        src={"/icons/tag.svg"}
                        alt="tag"
                        width={20}
                        height={20}
                    />
                }
                label={t("common.tag")}
            >
                <EditableTagsValue
                    value={leadDetail?.tags || []}
                    fieldName="tags"
                    orgId={orgId}
                    leadId={leadDetail?.id || ""}
                />
            </EditableFieldRow>
            <EditableFieldRow
                icon={
                    <Image
                        src={"/icons/user_circle_check.svg"}
                        alt="user_circle_check"
                        width={20}
                        height={20}
                    />
                }
                label={t("common.assignee")}
                onSave={async () => {
                    // Callback này sẽ được gọi khi user xác nhận trong EditableAssigneeValue
                    // EditableAssigneeValue sẽ tự động gọi setIsEditing(false) sau khi hoàn thành
                }}
                onCancel={() => {
                    // Callback này sẽ được gọi khi user hủy
                }}
                isDisplayButton={false}
            >
                <EditableAssigneeValue
                    assignee={owner}
                    followers={followers}
                    orgId={orgId}
                    customerId={leadDetail?.id || ""}
                    leadDetail={leadDetail}
                />
            </EditableFieldRow>

            {/* Người theo dõi */}
            <EditableFieldRow
                icon={
                    <Image
                        src={"/icons/user_circle_check.svg"}
                        alt="user_circle_check"
                        width={20}
                        height={20}
                    />
                }
                label={t("common.follower")}
                onSave={async () => {
                    // Callback này sẽ được gọi khi user xác nhận trong EditableAssigneeValue
                    // EditableAssigneeValue sẽ tự động gọi setIsEditing(false) sau khi hoàn thành
                }}
                onCancel={() => {
                    // Callback này sẽ được gọi khi user hủy
                }}
                isDisplayButton={false}
            >
                <EditableAssigneesValue
                    assignees={followers}
                    orgId={orgId}
                    customerId={leadDetail?.id || ""}
                    owner={owner?.profileId || ""}
                />
            </EditableFieldRow>
        </div>
    );
}
