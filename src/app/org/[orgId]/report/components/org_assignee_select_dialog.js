import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IoMdSearch } from "react-icons/io";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { getOrgMembers } from "@/api/org";
import { getAvatarUrl } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Dialog for selecting organization members as assignees
 * @param {Object} props Component properties
 * @param {boolean} props.open Whether the dialog is open
 * @param {Function} props.setOpen Function to set the open state
 * @param {Array} props.selected Currently selected member IDs
 * @param {Function} props.onSelect Function to call when selection changes
 * @param {string} props.orgId Organization ID
 */
export function OrgAssigneeSelectDialog({
    open,
    setOpen,
    selected = [],
    onSelect,
    orgId,
}) {
    const [selectedIds, setSelectedIds] = useState(selected || []);
    const [searchText, setSearchText] = useState("");
    const [unassignedSelected, setUnassignedSelected] = useState(
        selected.includes("00000000-0000-0000-0000-000000000000")
    );
    const [memberList, setMemberList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Reset selections when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedIds(selected || []);
            setUnassignedSelected(
                selected.includes("00000000-0000-0000-0000-000000000000")
            );
            setPage(0);
            setMemberList([]);
            setHasMore(true);
            loadMembers(0);
        }
    }, [selected, open, orgId]);

    // Load members when search text changes
    useEffect(() => {
        if (open) {
            setPage(0);
            setMemberList([]);
            setHasMore(true);
            loadMembers(0);
        }
    }, [searchText, open]);

    // Function to load members from the API
    const loadMembers = async (pageNumber) => {
        if (!orgId) return;

        setLoading(true);
        try {
            const value = await getOrgMembers(orgId, pageNumber, searchText);
            if (value.code === 0) {
                if (pageNumber === 0) {
                    setMemberList(value.content);
                } else {
                    setMemberList((prev) => [...prev, ...value.content]);
                }

                if ((value?.content?.length ?? 0) < 20) {
                    setHasMore(false);
                }
            } else {
                toast.error(value.message || "Failed to load members");
            }
        } catch (error) {
            console.error("Error loading members:", error);
            toast.error("An error occurred while loading members");
        } finally {
            setLoading(false);
        }
    };

    // Load more members
    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadMembers(nextPage);
    };

    // Handle save button click
    const handleSave = () => {
        onSelect(selectedIds, memberList);
        setOpen(false);
    };

    // Handle select all members
    const handleSelectAllMembers = (checked) => {
        if (checked) {
            const allMemberIds = memberList.map((member) => member.profileId);
            // Add all member IDs that aren't already in the selection
            const newSelectedIds = [
                ...new Set([...selectedIds, ...allMemberIds]),
            ];
            setSelectedIds(newSelectedIds);
        } else {
            // Keep the "Unassigned" item if it was selected
            if (unassignedSelected) {
                setSelectedIds(["00000000-0000-0000-0000-000000000000"]);
            } else {
                setSelectedIds([]);
            }
        }
    };

    // Handle unassigned selection
    const handleSelectUnassigned = (checked) => {
        setUnassignedSelected(checked);
        if (checked) {
            // Add "Unassigned" ID to the selected list if not already there
            if (!selectedIds.includes("00000000-0000-0000-0000-000000000000")) {
                setSelectedIds([
                    ...selectedIds,
                    "00000000-0000-0000-0000-000000000000",
                ]);
            }
        } else {
            // Remove "Unassigned" ID from the selected list
            setSelectedIds(
                selectedIds.filter(
                    (id) => id !== "00000000-0000-0000-0000-000000000000"
                )
            );
        }
    };

    // Check if all members are selected
    const areAllMembersSelected =
        memberList.length > 0 &&
        memberList.every((member) => selectedIds.includes(member.profileId));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Chọn thành viên phụ trách</DialogTitle>
                </DialogHeader>

                <div className="relative flex items-center w-full">
                    <div className="h-auto absolute left-4 top-1/2 -translate-y-1/2">
                        <IoMdSearch className="text-2xl" />
                    </div>
                    <Input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Nhập tên thành viên"
                        className="pl-12"
                    />
                </div>

                <div className="flex items-center space-x-3 p-2 border-b">
                    <Checkbox
                        checked={areAllMembersSelected}
                        onCheckedChange={handleSelectAllMembers}
                    />
                    <div>Chọn tất cả</div>

                    <div className="ml-4 flex items-center space-x-3">
                        <Checkbox
                            checked={unassignedSelected}
                            onCheckedChange={handleSelectUnassigned}
                        />
                        <div>Chưa phụ trách</div>
                    </div>
                </div>

                <ScrollArea className="h-[400px]">
                    {memberList.map((member) => (
                        <div
                            key={member.profileId}
                            className="flex items-center space-x-3 p-2"
                        >
                            <Checkbox
                                checked={selectedIds.includes(member.profileId)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedIds([
                                            ...selectedIds,
                                            member.profileId,
                                        ]);
                                    } else {
                                        setSelectedIds(
                                            selectedIds.filter(
                                                (id) => id !== member.profileId
                                            )
                                        );
                                    }
                                }}
                            />
                            <Avatar
                                name={member.fullName}
                                src={getAvatarUrl(member.avatar)}
                                size="46"
                                round
                                className="object-cover"
                            />
                            <div className="flex flex-col">
                                <div>{member.fullName}</div>
                                <div className="text-xs text-muted-foreground">
                                    {member.email}
                                </div>
                            </div>
                        </div>
                    ))}

                    {hasMore && (
                        <div className="flex justify-center p-2">
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={loadMore}
                                >
                                    Tải thêm
                                </Button>
                            )}
                        </div>
                    )}
                </ScrollArea>

                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave}>Lưu</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
