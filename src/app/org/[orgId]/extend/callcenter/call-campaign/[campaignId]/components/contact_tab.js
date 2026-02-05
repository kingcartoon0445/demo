"use client";

import {
    addCallcampaignContact,
    getCallcampaignContactList,
    removeCallcampaignContact,
} from "@/api/callcenter";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { Button } from "@/components/ui/button";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFirstAndLastWord } from "@/lib/utils";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { MdAdd, MdDelete, MdSearch } from "react-icons/md";
import { useInView } from "react-intersection-observer";
import AddContactDialog from "./steps/AddContact/AddContactDialog";

export default function ContactTab() {
    const { ref, inView } = useInView();
    const queryClient = useQueryClient();
    const { orgId, campaignId } = useParams();
    const [searchText, setSearchText] = useState("");
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        contactId: null,
    });

    const {
        data,
        status,
        isFetchingNextPage,
        error,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: ["callcampaignContacts", orgId, campaignId, searchText],
        queryFn: async ({ pageParam }) => {
            try {
                const response = await getCallcampaignContactList(
                    orgId,
                    campaignId,
                    {
                        SearchText: searchText,
                        offset: pageParam * 10,
                        limit: 10,
                    }
                );
                if (!response) {
                    throw new Error("Không có dữ liệu trả về");
                }
                return response;
            } catch (err) {
                console.error("Chi tiết lỗi:", err);
                throw new Error(
                    `Lỗi khi tải danh sách liên hệ: ${err.message}`
                );
            }
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.metadata.count == 10
                ? lastPage.metadata.offset / 10 + 1
                : null,
    });
    useEffect(() => {
        let timeoutId;
        if (!isFetchingNextPage && inView && hasNextPage) {
            timeoutId = setTimeout(() => {
                fetchNextPage();
            }, 300);
        }
        return () => clearTimeout(timeoutId);
    }, [fetchNextPage, inView, hasNextPage, isFetchingNextPage]);

    const contacts = data?.pages?.flatMap((page) => page?.content || []) || [];

    const handleAddContact = async (contacts) => {
        try {
            const formattedContacts = Array.isArray(contacts)
                ? contacts.map((c) => ({ phone: c.phone, name: c.name }))
                : [{ phone: contacts.phone, name: contacts.name }];

            const response = await addCallcampaignContact(
                orgId,
                campaignId,
                formattedContacts
            );
            if (response?.code === 0) {
                toast.success("Thêm khách hàng thành công");
                // Refresh danh sách
                queryClient.invalidateQueries([
                    "callcampaignContacts",
                    orgId,
                    campaignId,
                ]);
            } else {
                toast.error(response?.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi thêm khách hàng");
            console.error(error);
        }
    };

    const handleDeleteContact = async () => {
        try {
            const response = await removeCallcampaignContact(
                orgId,
                campaignId,
                deleteDialog.contactId
            );
            if (response?.code === 0) {
                toast.success("Xóa liên hệ thành công");
                queryClient.invalidateQueries([
                    "callcampaignContacts",
                    orgId,
                    campaignId,
                ]);
            } else {
                toast.error(response?.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi xóa liên hệ");
            console.error(error);
        } finally {
            setDeleteDialog({ open: false, contactId: null });
        }
    };

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className="flex justify-between mt-4 flex-1">
                <div className="w-[300px] relative">
                    <Input
                        type="text"
                        placeholder="Tìm kiếm bằng số điện thoại hoặc tên"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full rounded-lg pl-9"
                    />
                    <MdSearch
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                        size={20}
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setOpenAddDialog(true)}
                    className="text-primary h-[34px] px-2 border-primary hover:bg-primary/10 hover:text-primary"
                >
                    <MdAdd className="mr-1 text-xl" />
                    Tạo mới
                </Button>
            </div>

            {status === "pending" ? (
                <div className="p-4 text-center text-gray-500">Đang tải...</div>
            ) : status === "error" ? (
                <div className="p-4 text-center text-red-500">
                    {error?.message ||
                        "Có lỗi xảy ra khi tải danh sách liên hệ"}
                </div>
            ) : (
                <ScrollArea className="h-[calc(100dvh-440px)]">
                    <div className="flex flex-col gap-4">
                        {contacts.map((contact, index) => (
                            <ContextMenu key={index}>
                                <ContextMenuTrigger>
                                    <div className="flex items-center p-3 rounded-lg border bg-white hover:bg-gray-50">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Avatar
                                                    name={getFirstAndLastWord(
                                                        contact?.fullName
                                                    )}
                                                    round={true}
                                                    size="40"
                                                />
                                            </div>

                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {contact.phone.replace(
                                                            /^84/,
                                                            "0"
                                                        )}
                                                    </span>
                                                    <span className="px-1.5 py-[1px] text-xs border border-land text-land rounded">
                                                        {contact.provider}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-title font-medium">
                                                    {contact.fullName}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <span>Số lần gọi:</span>
                                                <span className="text-title font-medium">
                                                    {contact.numberOfCalls}
                                                </span>
                                            </div>
                                            <span className="text-sm text-blue-500 hover:underline cursor-pointer">
                                                {contact.stageName}
                                            </span>
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem
                                        className="text-red-500 focus:text-red-500 flex items-center gap-2"
                                        onClick={() =>
                                            setDeleteDialog({
                                                open: true,
                                                contactId: contact.id,
                                            })
                                        }
                                    >
                                        <MdDelete />
                                        Xóa liên hệ
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        ))}
                        <div ref={ref} className="min-h-[32px]">
                            {isFetchingNextPage && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            )}
                            {!hasNextPage && contacts.length > 0 && (
                                <div className="text-center text-gray-500 py-4">
                                    Đã tải hết dữ liệu
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            )}

            <AddContactDialog
                open={openAddDialog}
                setOpen={setOpenAddDialog}
                onAddContact={handleAddContact}
            />

            <CustomerAlertDialog
                open={deleteDialog.open}
                setOpen={(open) => setDeleteDialog({ ...deleteDialog, open })}
                title="Xóa liên hệ"
                subtitle="Bạn có chắc chắn muốn xóa liên hệ này? Hành động này không thể hoàn tác."
                onSubmit={handleDeleteContact}
            />
        </div>
    );
}
