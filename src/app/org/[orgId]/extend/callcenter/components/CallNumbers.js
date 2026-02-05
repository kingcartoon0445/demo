"use client"
import { CallBackIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MdCall } from "react-icons/md";
import AddNumberDialog from "./add_number_dialog";
import { useState } from "react";

export default function CallNumbers({ callcenterStatis, isActive }) {
    const [openAddNumber, setOpenAddNumber] = useState(false);
    return (
        <div className="flex flex-col gap-2 mt-3">
            {openAddNumber && <AddNumberDialog
                open={openAddNumber}
                setOpen={setOpenAddNumber}
            />}
            <div className="text-[18px] font-medium flex items-center justify-between">
                <div>Đầu số</div>
                {isActive && <Button onClick={() => setOpenAddNumber(true)} variant="ghost" className="text-primary hover:text-primary/80 text-sm h-[30px]">Mua thêm đầu số</Button>}
            </div>
            <ScrollArea className="flex gap-2 w-full">
                {callcenterStatis?.lines?.map((data, index) => (
                    <NumberItem key={index} number={data.phoneNumber} isAllowAll={data.isAllowAll} isAllowCallBack={data.isAllowCallBack} packageType={data.packageType} />
                ))}
            </ScrollArea>
        </div>
    )
}

const NumberItem = ({ number, isAllowAll, isAllowCallBack, packageType }) => {
    return <div className="p-4 rounded-lg border flex flex-col gap-2 w-[250px] h-[140px]">
        <div className="flex items-center gap-2"> <div className="w-[12px] h-[12px] rounded-full bg-[#D1D3D6]" /> <div className="text-title font-medium">{getPackageType(packageType)}</div> </div>
        <div className="text-title font-medium">{number?.startsWith('84') ? '0' + number.slice(2) : number}</div>
        <div className="flex items-center gap-2 text-sm text-text2"> <MdCall className="text-[#5EB640] h-[14px] w-[14px]" /> {isAllowAll ? "Tất cả thành viên" : "Tùy chọn"}</div>
        <div className="flex items-center gap-2 text-sm text-text2"> <CallBackIcon className="fill-[#64D9FF] h-[14px] w-[14px]" />  {isAllowCallBack ? "Không áp dụng gọi vào" : "Áp dụng gọi vào"}</div>
    </div>
}

const getPackageType = (packageType) => {
    switch (packageType) {
        case "LINE_CALL_CENTER_DEFAULT": return "Đầu số mặc định"
        case "LINE_CALL_CENTER_FIXED": return "Đầu số cố định"
    }
}
