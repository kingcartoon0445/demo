import { Lead } from "@/lib/interface";
//import { transformJourneyArrayToTimeline } from "@/lib/journeyUtils";
import { useLeadDetailApi } from "@/hooks/useCustomerDetail";
import { useEffect, useRef } from "react";
import TabsUserDetail from "../common/TabsUserDetail";

interface CustomerTimelineProps {
    onShowCustomerDetail?: () => void;
    customer?: Lead | null;
    orgId?: string;
    onSelectCustomer?: (customer: Lead | null) => void;
    isArchiveMode?: boolean; // Thêm prop isArchiveMode
}

export function CustomerTimeline({
    onShowCustomerDetail,
    customer,
    orgId,
    onSelectCustomer,
    isArchiveMode = false, // Mặc định là false
}: CustomerTimelineProps) {
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Ensure detail is loaded when arriving via lid param (URL restore)
    const { data: leadDetail } = useLeadDetailApi(
        orgId || "",
        customer?.id || ""
    );

    // Cleanup observer khi component unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    const handleShowCustomerDetail = () => {
        if (onShowCustomerDetail) {
            onShowCustomerDetail();
        }
    };

    return (
        <div className="bg-background border-r h-full flex flex-col w-full">
            {/* Header */}
            {/* <div className="border-b p-2 2xl:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleShowCustomerDetail}
                            className="p-2 hover:bg-muted rounded-lg transition-colors 2xl:hidden"
                            title="Xem chi tiết khách hàng"
                        >
                            <PanelRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div> */}

            {/* Body - Timeline */}
            <TabsUserDetail
                taskId={null}
                provider="lead"
                customer={(leadDetail?.content as any) || customer || null}
                orgId={orgId || ""}
                workspaceId={""}
                handleShowCustomerDetail={handleShowCustomerDetail}
            />
        </div>
    );
}
