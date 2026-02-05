import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useOrgMembers } from "@/hooks/useOrganizations";
import { OrgMember } from "@/lib/interface";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import Avatar from "react-avatar";

interface OrgMemberSelectProps {
    orgId: string;
    onSelect: (member: OrgMember | null) => void;
    value?: string;
    placeholder?: string;
}

export function OrgMemberSelect({
    orgId,
    onSelect,
    value,
    placeholder,
}: OrgMemberSelectProps) {
    const { data: membersResponse, isLoading } = useOrgMembers(orgId);
    const members = membersResponse?.content || [];
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const normalizedSearch = search.trim().toLowerCase();
    const filteredMembers = members.filter((member: OrgMember) =>
        (member.fullName || "").toLowerCase().includes(normalizedSearch)
    );

    const selectedMember = members.find(
        (m: OrgMember) => m.profileId === value
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                >
                    {selectedMember?.fullName ? (
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex items-center gap-2 w-full">
                                <Avatar
                                    src={
                                        getAvatarUrl(
                                            selectedMember?.avatar || ""
                                        ) || undefined
                                    }
                                    name={getFirstAndLastWord(
                                        selectedMember?.fullName
                                    )}
                                    size="20"
                                    round={true}
                                />
                                <span>{selectedMember?.fullName}</span>
                            </div>
                            <ChevronDown className="ml-1 h-3 w-3" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full">
                            <span>{placeholder || "Chọn thành viên..."}</span>
                            <ChevronDown className="ml-1 h-3 w-3" />
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Tìm kiếm thành viên..."
                        onValueChange={setSearch}
                        value={search}
                    />
                    <CommandList>
                        {/* Option để bỏ chọn */}
                        <CommandItem
                            value="clear"
                            onSelect={() => {
                                onSelect(null);
                                setOpen(false);
                                setSearch("");
                            }}
                        >
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">
                                    Không chọn
                                </span>
                            </div>
                        </CommandItem>
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map((member: OrgMember) => (
                                <CommandItem
                                    key={member.profileId}
                                    onSelect={() => {
                                        onSelect(member);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    value={member.profileId}
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Avatar
                                                src={
                                                    getAvatarUrl(
                                                        member.avatar || ""
                                                    ) || undefined
                                                }
                                                name={getFirstAndLastWord(
                                                    member.fullName
                                                )}
                                                size="20"
                                                round={true}
                                            />
                                            <span>{member.fullName}</span>
                                        </div>
                                        {member.email && (
                                            <span className="text-sm text-muted-foreground">
                                                {member.email}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))
                        ) : (
                            <CommandEmpty>Không có thành viên</CommandEmpty>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
