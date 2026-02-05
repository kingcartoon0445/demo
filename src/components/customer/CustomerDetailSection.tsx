"use client";

import { useUnlinkToCustomer } from "@/hooks/useConversation";
import { useUnlinkLeadToCustomer } from "@/hooks/useCustomerDetail";
import { formatDate, getGenderText } from "@/lib/customerDetailTypes";
import {
    BriefcaseIcon,
    MailIcon,
    MoreHorizontalIcon,
    PhoneIcon,
    UserIcon,
} from "lucide-react";
import Image from "next/image";
import EditableDateValue from "../common/EditableDateValue";
import { EditableFieldRow } from "../common/EditableFieldRow";
import EditableSelectValue from "../common/EditableSelectValue";
import EditableValue from "../common/EditableValue";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

interface CustomerDetailSectionProps {
    customerDetail?: any;
    customer?: any;
    orgId: string;
    conversationId?: string;
    leadId?: string;
    onRefreshCustomer?: () => void;
    showCustomerName?: boolean;
}

export default function CustomerDetailSection({
    customerDetail,
    customer,
    orgId,
    leadId,
    conversationId,
    onRefreshCustomer,
    showCustomerName = false,
}: CustomerDetailSectionProps) {
    const { t } = useLanguage();
    const { mutate: unlinkCustomer } = conversationId
        ? useUnlinkToCustomer(orgId, conversationId)
        : useUnlinkLeadToCustomer(orgId, leadId || "");

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h3 className="text-[14px] text-black font-medium">
                    {t("common.customer")}
                </h3>
                {!showCustomerName && (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontalIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem
                                    onClick={() => unlinkCustomer()}
                                >
                                    <span>{t("common.deleteLink")}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}
            </div>

            {showCustomerName && (
                <EditableFieldRow
                    icon={<UserIcon className="w-5 h-5 text-gray-600" />}
                    label={t("common.customerName")}
                >
                    <EditableValue
                        value={
                            customerDetail?.fullName || customer?.fullName || ""
                        }
                        fieldName="fullName"
                        placeholder={t("common.enterCustomerName")}
                        orgId={orgId}
                        leadId={conversationId || ""}
                        customerId={customerDetail?.id || customer?.id || ""}
                        onRefreshCustomer={onRefreshCustomer}
                    />
                </EditableFieldRow>
            )}

            <EditableFieldRow
                icon={<PhoneIcon className="w-5 h-5 text-gray-600" />}
                label={t("common.phone")}
            >
                <EditableValue
                    value={customerDetail?.phone || customer?.phone || ""}
                    fieldName="phone"
                    type="tel"
                    placeholder={t("common.enterPhone")}
                    orgId={orgId}
                    leadId={conversationId || ""}
                    customerId={customerDetail?.id || customer?.id || ""}
                    onRefreshCustomer={onRefreshCustomer}
                />
            </EditableFieldRow>

            <EditableFieldRow
                icon={<MailIcon className="w-5 h-5 text-gray-600" />}
                label={t("common.email")}
            >
                <EditableValue
                    value={customerDetail?.email || customer?.email || ""}
                    fieldName="email"
                    type="email"
                    placeholder={t("common.enterEmail")}
                    orgId={orgId}
                    leadId={conversationId || ""}
                    customerId={customerDetail?.id || customer?.id || ""}
                    onRefreshCustomer={onRefreshCustomer}
                />
            </EditableFieldRow>

            <EditableFieldRow
                icon={<UserIcon className="w-5 h-5 text-gray-600" />}
                label={t("common.gender")}
            >
                <EditableSelectValue
                    value={customerDetail?.gender ?? customer?.gender ?? 2}
                    fieldName="gender"
                    options={[
                        { value: "0", label: t("common.female") },
                        { value: "1", label: t("common.male") },
                        { value: "2", label: t("common.unknown") },
                    ]}
                    placeholder={t("common.selectGender")}
                    getDisplayText={(value) => {
                        const numValue =
                            typeof value === "string" ? parseInt(value) : value;
                        return getGenderText(numValue);
                    }}
                    orgId={orgId}
                    leadId={conversationId || ""}
                    customerId={customerDetail?.id || customer?.id || ""}
                    onRefreshCustomer={onRefreshCustomer}
                />
            </EditableFieldRow>

            <EditableFieldRow
                icon={
                    <Image
                        src={"/icons/cake.svg"}
                        alt="cake"
                        width={20}
                        height={20}
                    />
                }
                label={t("common.dob")}
            >
                <EditableDateValue
                    value={customerDetail?.dob || customer?.dob || ""}
                    fieldName="dob"
                    placeholder={t("common.enterDob")}
                    displayFormat={formatDate}
                    orgId={orgId}
                    leadId={conversationId || ""}
                    customerId={customerDetail?.id || customer?.id || ""}
                    onRefreshCustomer={onRefreshCustomer}
                />
            </EditableFieldRow>

            <EditableFieldRow
                icon={<BriefcaseIcon className="w-5 h-5 text-gray-600" />}
                label={t("common.work")}
            >
                <EditableValue
                    value={customerDetail?.work || customer?.work || ""}
                    fieldName="work"
                    placeholder={t("common.enterWork")}
                    orgId={orgId}
                    leadId={conversationId || ""}
                    customerId={customerDetail?.id || customer?.id || ""}
                    onRefreshCustomer={onRefreshCustomer}
                />
            </EditableFieldRow>

            <EditableFieldRow
                icon={
                    <Image
                        src={"/icons/id_card.svg"}
                        alt="id_card"
                        width={20}
                        height={20}
                    />
                }
                label={t("common.physicalId")}
            >
                <EditableValue
                    value={
                        customerDetail?.physicalId || customer?.physicalId || ""
                    }
                    fieldName="physicalId"
                    placeholder={t("common.enterPhysicalId")}
                    orgId={orgId}
                    leadId={conversationId || ""}
                    customerId={customerDetail?.id || customer?.id || ""}
                    onRefreshCustomer={onRefreshCustomer}
                />
            </EditableFieldRow>

            <EditableFieldRow
                icon={
                    <Image
                        src={"/icons/location.svg"}
                        alt="location"
                        width={20}
                        height={20}
                    />
                }
                label={t("common.address")}
            >
                <EditableValue
                    value={customerDetail?.address || customer?.address || ""}
                    fieldName="address"
                    placeholder={t("common.enterAddress")}
                    orgId={orgId}
                    leadId={conversationId || ""}
                    customerId={customerDetail?.id || customer?.id || ""}
                    onRefreshCustomer={onRefreshCustomer}
                />
            </EditableFieldRow>
        </div>
    );
}
