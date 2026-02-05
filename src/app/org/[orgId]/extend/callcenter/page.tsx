"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import CallCampaignTab from "./callCampaignTab";
import CallCenterTab from "./callCenterTab";

export default function CallCenterPage() {
    const params = useParams();
    const orgId = params.orgId as string;

    if (!orgId) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="campaign" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="campaign">Gọi hàng loạt</TabsTrigger>
                    <TabsTrigger value="center">Tổng đài</TabsTrigger>
                </TabsList>

                <TabsContent value="campaign" className="space-y-4">
                    <CallCampaignTab />
                </TabsContent>

                <TabsContent value="center" className="space-y-4">
                    <CallCenterTab params={params} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
