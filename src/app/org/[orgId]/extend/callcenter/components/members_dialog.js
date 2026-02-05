"use client";
import {
    addRemoveCallcenterMember,
    getCallcenterMembers,
} from "@/api/callcenter";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { MdClose } from "react-icons/md";
import { IoMdSearch } from "react-icons/io";
import { Input } from "@/components/ui/input";
import { useDebounce } from "use-debounce";

export default function MembersDialog({
    open,
    setOpen,
    callcenterStatis,
    setReload,
}) {
    const [members, setMembers] = useState([]);
    const { orgId } = useParams();
    // Thêm state cho search
    const [searchMember, setSearchMember] = useState("");
    const [debouncedSearchMember] = useDebounce(searchMember, 200);

    useEffect(() => {
        getCallcenterMembers(orgId, callcenterStatis.packageUsageId, {
            limit: 1000,
        }).then((res) => {
            if (res.code == 0) {
                setMembers(res.content);
            }
        });
    }, [callcenterStatis.packageUsageId]);

    // Thêm filtered members
    const filteredMembers = members.filter(
        (member) =>
            member?.fullName
                ?.toLowerCase()
                .includes(debouncedSearchMember.toLowerCase()) || false
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        Tổng đài COKA
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col px-4">
                    <div className="text-sm text-title font-medium mt-4">
                        Thành viên: {callcenterStatis.member} /{" "}
                        {callcenterStatis.memberLimit}
                    </div>

                    {/* Thêm input search */}
                    <div className="relative flex items-center w-full mt-2">
                        <div className="h-auto absolute left-4 top-1/2 -translate-y-1/2 transform">
                            <IoMdSearch className="text-2xl" />
                        </div>
                        <Input
                            value={searchMember}
                            onChange={(e) => setSearchMember(e.target.value)}
                            placeholder="Tìm kiếm thành viên"
                            className="h-[40px] pl-12"
                        />
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="flex flex-col gap-4 py-4 h-[60dvh] mb-10">
                            {/* Thay đổi members thành filteredMembers */}
                            {filteredMembers.map((member, index) => (
                                <MemberItem
                                    key={index}
                                    member={member}
                                    callcenterStatis={callcenterStatis}
                                    setOpen={setOpen}
                                    orgId={orgId}
                                    setMembers={setMembers}
                                    setReload={setReload}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter
                    className={"h-[30px] rounded-b-xl"}
                ></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function MemberItem({
    member,
    callcenterStatis,
    setMembers,
    orgId,
    setReload,
}) {
    const [loading, setLoading] = useState(false);
    const handleAddMember = (profileId) => {
        setLoading(true);
        addRemoveCallcenterMember(orgId, callcenterStatis.packageUsageId, {
            profileId,
            status: 1,
        }).then((res) => {
            if (res.code == 0) {
                setMembers((prev) =>
                    prev.map((m) =>
                        m.profileId == profileId ? { ...m, isActive: true } : m
                    )
                );
                setReload((prev) => !prev);
            } else {
                toast.error(res.message);
            }
        });
        setLoading(false);
    };

    const handleRemoveMember = (profileId) => {
        setLoading(true);
        addRemoveCallcenterMember(orgId, callcenterStatis.packageUsageId, {
            profileId,
            status: 0,
        }).then((res) => {
            if (res.code == 0) {
                setMembers((prev) =>
                    prev.map((m) =>
                        m.profileId == profileId ? { ...m, isActive: false } : m
                    )
                );
                setReload((prev) => !prev);
            } else {
                toast.error(res.message);
            }
        });
        setLoading(false);
    };
    return (
        <div className="flex items-center gap-2">
            <Avatar
                name={getFirstAndLastWord(member.fullName)}
                src={getAvatarUrl(member.avatar)}
                size="35"
                round
                className="border border-primary object-cover"
            />
            <div className="text-title font-medium">{member.fullName}</div>
            {member.isActive ? (
                <Button
                    loading={loading}
                    variant="outline"
                    className="text-sm ml-auto border-primary h-[30px] text-primary"
                    onClick={() => handleRemoveMember(member.profileId)}
                >
                    Loại bỏ
                </Button>
            ) : (
                <Button
                    loading={loading}
                    className="text-sm ml-auto h-[30px]"
                    onClick={() => handleAddMember(member.profileId)}
                >
                    Thêm
                </Button>
            )}
        </div>
    );
}
