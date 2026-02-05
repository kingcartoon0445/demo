import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import Image from "next/image";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { useState, useEffect } from "react";

export const UnlinkButton = ({ title, onUnlink, provider }) => {
    const [openAlert, setOpenAlert] = useState(false);

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenAlert(true);
    };
    return (
        <div className={` ${provider ? "" : "ml-auto"}`}>
            <TooltipProvider>
                <Tooltip content={<p>Gỡ kết nối</p>}>
                    <div
                        className={`${
                            provider
                                ? "opacity-100"
                                : "group-hover:opacity-100 opacity-0"
                        } flex w-[26px] h-[26px] rounded-full items-center justify-center text-white bg-[#D1D3D6] hover:bg-destructive transition-all duration-300 cursor-pointer`}
                        onClick={handleClick}
                    >
                        <Image
                            src="/icons/unlink.svg"
                            alt="ico"
                            width={14}
                            height={14}
                        />
                    </div>
                </Tooltip>
            </TooltipProvider>

            {openAlert && (
                <CustomerAlertDialog
                    open={openAlert}
                    setOpen={setOpenAlert}
                    title="Xác nhận gỡ kết nối"
                    subtitle={`Bạn có chắc chắn muốn gỡ kết nối ${title}?`}
                    onSubmit={(e) => {
                        onUnlink();
                        setOpenAlert(false);
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                />
            )}
        </div>
    );
};
