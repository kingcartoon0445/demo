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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspaceList } from "@/hooks/workspace_data";
import { getAvatarUrl } from "@/lib/utils";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";
import { MdCheck } from "react-icons/md";

export function WorkspaceMultiSelectDialog({
    open,
    setOpen,
    selected = [],
    onSelect,
}) {
    const { workspaceList, setWorkspaceList, workspacesRefresh } =
        useWorkspaceList();
    const [selectedWorkspaces, setSelectedWorkspaces] = useState(selected);
    const currentOrg = localStorage.getItem("currentOrgId");
    useEffect(() => {
        getWorkspaceList(currentOrg).then((res) => {
            if (res?.code == 0) {
                const data = res.content;
                setWorkspaceList(data);
            } else {
                localStorage.removeItem("currentOrgId");
                router.push("/");
            }
        });
    }, [workspacesRefresh]);

    useEffect(() => {
        setSelectedWorkspaces(selected);
    }, [selected]);

    // Xử lý chọn tất cả workspace
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedWorkspaces(workspaceList);
        } else {
            setSelectedWorkspaces([]);
        }
    };

    // Xử lý khi lưu lại
    const handleSave = () => {
        // So sánh danh sách workspace đã chọn với danh sách ban đầu
        const hasChanges =
            JSON.stringify([...selectedWorkspaces].map((w) => w.id).sort()) !==
            JSON.stringify([...selected].map((w) => w.id).sort());

        // Luôn gọi onSelect với giá trị hiện tại để đảm bảo thay đổi được phát hiện
        onSelect(selectedWorkspaces);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-y-auto max-h-[550px] gap-4 w-[450px]">
                <DialogHeader>
                    <DialogTitle className="font-medium text-base mb-2">
                        Chọn không gian làm việc
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>

                <div className="flex items-center space-x-2 px-2">
                    <Checkbox
                        id="selectAllWorkspaces"
                        checked={
                            workspaceList.length > 0 &&
                            workspaceList.every((workspace) =>
                                selectedWorkspaces.some(
                                    (item) => item.id === workspace.id
                                )
                            )
                        }
                        onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="selectAllWorkspaces">Chọn tất cả</Label>
                </div>

                <ScrollArea className="max-h-[350px]">
                    <div className="space-y-2">
                        {workspaceList?.map((workspace, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground p-2 rounded-lg"
                            >
                                <Checkbox
                                    id={`workspace-${workspace.id}`}
                                    checked={selectedWorkspaces.some(
                                        (item) => item.id === workspace.id
                                    )}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedWorkspaces([
                                                ...selectedWorkspaces,
                                                workspace,
                                            ]);
                                        } else {
                                            setSelectedWorkspaces(
                                                selectedWorkspaces.filter(
                                                    (item) =>
                                                        item.id !== workspace.id
                                                )
                                            );
                                        }
                                    }}
                                />
                                <Avatar
                                    name={workspace.name}
                                    src={getAvatarUrl(workspace.avatar)}
                                    size="40"
                                    round
                                />
                                <Label
                                    htmlFor={`workspace-${workspace.id}`}
                                    className="flex-1 cursor-pointer font-medium"
                                >
                                    {workspace.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex items-center gap-2"
                    >
                        <MdCheck className="w-5 h-5" />
                        Áp dụng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
