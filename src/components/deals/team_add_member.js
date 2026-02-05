import { getOrgMembers } from "@/api/org";
import { addMember2Team } from "@/api/team";
import { addMemberToTeam, getAvailableMembers } from "@/api/teamV2";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCustomerParams } from "@/hooks/customers_data";
import {
    useAddMembersToTeamList,
    useDetailMemberList,
} from "@/hooks/team_data";
import { getAvatarUrl } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { IoMdSearch } from "react-icons/io";
import { useDebounce } from "use-debounce";

export default function TeamAddMember({ open, setOpen, orgId }) {
    const {
        page,
        searchText,
        setSearchText,
        incPage,
        resetPage,
        memberList: hookMemberList,
        setMemberList: hookSetMemberList,
        resetMemberList,
    } = useAddMembersToTeamList();

    // Sử dụng state local để quản lý danh sách thành viên
    const [memberList, setMemberList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [debouncedSearchText] = useDebounce(searchText, 500);
    const { workspaceId } = useCustomerParams();
    const { detailMemberList } = useDetailMemberList();
    const searchParams = useSearchParams();
    const teamId = searchParams.get("teamId");

    // Thêm useEffect để tải dữ liệu khi dialog mở
    useEffect(() => {
        if (open) {
            resetPage();
            resetMemberList();
            setMemberList([]);
            setHasMore(true);
        }
    }, [open, resetPage, resetMemberList]);

    useEffect(() => {
        resetPage();
        resetMemberList();
        setMemberList([]);
        setHasMore(true);
    }, [debouncedSearchText, resetPage, resetMemberList]);

    const next = useCallback(async () => {
        if (loading) return;

        setLoading(true);
        try {
            const value = await getAvailableMembers(
                orgId,
                teamId,
                page,
                debouncedSearchText
            );

            if (value?.code === 0) {
                if (value?.content?.length > 0) {
                    // Nối thêm dữ liệu mới vào danh sách hiện tại
                    setMemberList((prev) => [...prev, ...value.content]);
                    incPage();
                }
                if ((value?.content?.length ?? 0) < 20) {
                    setHasMore(false);
                }
            } else {
                const errorMessage =
                    value?.message || "Có lỗi xảy ra khi tải dữ liệu";
                toast.error(errorMessage);
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
            toast.error("Có lỗi xảy ra khi tải dữ liệu");
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [loading, orgId, page, debouncedSearchText, incPage]);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl pb-0">
                <DialogHeader>
                    <DialogTitle className="pb-5">
                        Thêm vào đội sale
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>
                <div className="flex flex-col items-center">
                    <div className={`relative flex items-center w-full`}>
                        <div className="h-auto absolute left-4 top-1/2 -translate-y-1/2 transform ">
                            <IoMdSearch className="text-2xl" />
                        </div>
                        <Input
                            defaultValue={searchText}
                            aria-describedby="search-members"
                            onChangeCapture={(e) => {
                                setSearchText(e.currentTarget.value);
                            }}
                            placeholder="Nhập tên thành viên"
                            type="search"
                            className={`bg-bg1 border-none h-[40px] pl-12 rounded-xl`}
                        />
                    </div>
                    <ScrollArea className="flex flex-col mt-4 h-[500px] w-full">
                        <div className="flex flex-col gap-1 items-center w-full">
                            {memberList.map((e, i) => (
                                <MemberItem
                                    item={e}
                                    key={i}
                                    detailMemberList={detailMemberList}
                                    orgId={orgId}
                                    workspaceId={workspaceId}
                                    teamId={teamId}
                                />
                            ))}
                            <InfiniteScroll
                                hasMore={hasMore}
                                isLoading={loading}
                                next={next}
                                threshold={1}
                            >
                                {hasMore && (
                                    <Loader2 className="my-1 md:my-4 h-8 w-8 animate-spin" />
                                )}
                            </InfiniteScroll>
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter className="sm:justify-end"></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const MemberItem = ({ item, detailMemberList, orgId, workspaceId, teamId }) => {
    const { setRefreshList } = useDetailMemberList();
    const [isInvted, setIsInvited] = useState(
        detailMemberList.find((e) => e?.profile?.id == item?.profileId) !=
            undefined
    );
    const [isLoading, setIsLoading] = useState(false);
    return (
        <div className="flex items-center gap-3 w-full">
            <Avatar
                name={item?.fullName}
                src={getAvatarUrl(item?.avatar)}
                size="46"
                className="object-cover"
                round
            />
            <div className="flex flex-col">
                <div className="font-medium text-base">{item?.fullName}</div>
                <div className="text-xs flex items-center gap-1">
                    {item?.email}
                </div>
            </div>
            <div className="ml-auto">
                {isInvted ? (
                    <Button
                        variant="outline"
                        disabled
                        className="rounded-lg h-[36px]"
                    >
                        Đã thêm
                    </Button>
                ) : (
                    <Button
                        onClick={() => {
                            setIsLoading(true);
                            addMemberToTeam(orgId, teamId, {
                                profileId: item.profileId,
                            })
                                .then((res) => {
                                    setIsLoading(false);
                                    if (res?.message)
                                        return toast.error(res.message, {
                                            position: "top-center",
                                        });
                                    setIsInvited(true);
                                    setRefreshList();
                                })
                                .catch((e) => {
                                    setIsLoading(false);
                                });
                        }}
                        className="rounded-lg h-[36px] gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" /> Đang thêm
                            </>
                        ) : (
                            "Thêm"
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};
