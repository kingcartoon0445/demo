import { updateTeamV2 } from "@/api/teamV2";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCustomerParams } from "@/hooks/customers_data";
import { useState } from "react";
import toast from "react-hot-toast";
const CustomInput = ({ children, ...prop }) => {
    return (
        <div className="flex">
            <div className="pl-4 pr-2 bg-bg1 rounded-l-xl whitespace-nowrap flex-nowrap flex items-center justify-center">
                <div className="border-r-[1px] pr-2 text-sm">{children}</div>
            </div>
            <Input
                {...prop}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
        </div>
    );
};
export default function TeamUpdateDialog({
    open,
    setOpen,
    setRefresh,
    updateTeamData,
    orgId,
}) {
    const [name, setName] = useState(updateTeamData.name);
    const { workspaceId } = useCustomerParams();

    const handleSubmit = () => {
        toast.promise(
            updateTeamV2(orgId, workspaceId, updateTeamData.id, { name }).then(
                (res) => {
                    if (res?.message) throw res.message;
                    setOpen(false);
                    setRefresh();
                }
            ),
            {
                loading: "Vui lòng chờ...",
                success: `Bạn đã sửa tên thành đội sale ${name}`,
                error: (data) =>
                    data?.message || data?.toString() || "Có lỗi xảy ra",
            },
            { position: "top-center" }
        );
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="grid sm:max-w-xl h-auto pt-4 transition-all">
                <DialogHeader>
                    <DialogTitle
                        className={
                            "font-medium text-[20px] text-title flex items-center justify-between mb-3"
                        }
                    >
                        Sửa team
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>
                <div className="flex flex-col items-center">
                    <div className="flex flex-col w-full mt-2 gap-3">
                        <CustomInput
                            placeHolder="Đội sale A"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                            }}
                        >
                            Tên team
                        </CustomInput>
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        variant="default"
                        className="h-[35px]"
                        onClick={handleSubmit}
                    >
                        Đồng ý
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
