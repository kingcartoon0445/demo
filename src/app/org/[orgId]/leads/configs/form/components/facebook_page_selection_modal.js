import { getWorkspaceList } from "@/api/workspace";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function FacebookPageSelectionModal({
    open,
    setOpen,
    pages,
    orgId,
    onConnect,
    isConnecting,
    showWorkspaceSelector = true,
}) {
    const [selectedPages, setSelectedPages] = useState([]);
    const [workspaceList, setWorkspaceList] = useState([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }
        if (!showWorkspaceSelector) {
            setWorkspaceList([]);
            setSelectedWorkspaceId("");
            return;
        }
        if (!orgId) return;
        getWorkspaceList(orgId)
            .then((res) => {
                if (res?.code === 0) {
                    setWorkspaceList(res.content || []);
                }
            })
            .catch((error) => {
                console.error("Error fetching workspaces:", error);
            });
    }, [open, orgId]);

    const handlePageToggle = (page, checked) => {
        if (checked) {
            setSelectedPages((prev) => [...prev, page]);
        } else {
            setSelectedPages((prev) => prev.filter((p) => p.id !== page.id));
        }
    };

    const handleConnect = () => {
        if (selectedPages.length === 0) {
            toast.error("Vui lòng chọn ít nhất một trang để kết nối", {
                position: "top-center",
            });
            return;
        }
        const workspaceId = showWorkspaceSelector
            ? selectedWorkspaceId || ""
            : "";
        onConnect(selectedPages, workspaceId);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedPages([...pages]);
        } else {
            setSelectedPages([]);
        }
    };

    const isAllSelected =
        pages.length > 0 && selectedPages.length === pages.length;
    const isIndeterminate =
        selectedPages.length > 0 && selectedPages.length < pages.length;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">
                        Chọn trang Facebook để kết nối
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[0.5px] bg-[#E4E7EC] -mx-6 mt-4" />
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {showWorkspaceSelector && workspaceList.length > 0 && (
                        <div className="p-4 border-b">
                            <div className="text-sm font-medium mb-2">
                                Không gian làm việc
                            </div>
                            <Select
                                value={selectedWorkspaceId}
                                onValueChange={setSelectedWorkspaceId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn không gian (tùy chọn)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workspaceList?.map((workspace) => (
                                        <SelectItem
                                            key={workspace.id}
                                            value={workspace.id}
                                        >
                                            {workspace.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {pages.length > 0 && (
                        <div className="flex items-center space-x-2 p-4 border-b">
                            <Checkbox
                                id="select-all"
                                checked={isAllSelected}
                                onCheckedChange={handleSelectAll}
                                className={
                                    isIndeterminate
                                        ? "data-[state=checked]:bg-blue-500"
                                        : ""
                                }
                            />
                            <label
                                htmlFor="select-all"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Chọn tất cả ({pages.length} trang)
                            </label>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4">
                        {pages.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không tìm thấy trang Facebook nào
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pages.map((page) => {
                                    const isSelected = selectedPages.some(
                                        (p) => p.id === page.id
                                    );
                                    return (
                                        <div
                                            key={page.id}
                                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                                isSelected
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                            onClick={() =>
                                                handlePageToggle(
                                                    page,
                                                    !isSelected
                                                )
                                            }
                                        >
                                            <Checkbox
                                                id={`page-${page.id}`}
                                                checked={isSelected}
                                                onCheckedChange={(checked) =>
                                                    handlePageToggle(
                                                        page,
                                                        checked
                                                    )
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                            {page.picture?.data?.url && (
                                                <img
                                                    src={page.picture.data.url}
                                                    alt={page.name}
                                                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`page-${page.id}`}
                                                    className="block text-sm font-medium text-gray-900 cursor-pointer"
                                                >
                                                    {page.name}
                                                </label>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {page.category}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    ID: {page.id}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="flex-1"
                        disabled={isConnecting}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleConnect}
                        className="flex-1 bg-primary hover:bg-primary/90"
                        disabled={isConnecting || selectedPages.length === 0}
                    >
                        {isConnecting
                            ? "Đang kết nối..."
                            : `Kết nối ${selectedPages.length} trang`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
