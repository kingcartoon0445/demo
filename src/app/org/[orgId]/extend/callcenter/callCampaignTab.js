"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { MdAdd } from "react-icons/md";
import CreateCampaignDialog from "./components/create_campaign_dialog";
import CallCampaignList from "./components/list_item";

export default function CallCampaignPage() {
    const [openCreateCampaignDialog, setOpenCreateCampaignDialog] =
        useState(false);

    return (
        <div className="flex flex-col h-full w-full">
            {openCreateCampaignDialog && (
                <CreateCampaignDialog
                    open={openCreateCampaignDialog}
                    setOpen={setOpenCreateCampaignDialog}
                />
            )}
            <div className="rounded-2xl flex flex-col bg-white h-full">
                <div className="flex items-center w-full pl-5 pr-3 py-4 border-b relative">
                    <div className="text-[18px] font-medium">
                        Chiến dịch gọi hàng loạt
                    </div>
                    <Button
                        onClick={() => setOpenCreateCampaignDialog(true)}
                        className={
                            "flex items-center gap-1 h-[35px] px-[10px] absolute right-5"
                        }
                    >
                        <MdAdd className="text-xl" />
                        Thêm mới
                    </Button>
                </div>
                <CallCampaignList />
            </div>
        </div>
    );
}
