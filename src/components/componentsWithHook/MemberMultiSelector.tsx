import { MultiSelect } from "@/components/ui/multi-select";
import { useOrgMembers } from "@/hooks/useOrganizations";
import { Skeleton } from "../ui/skeleton";
import { OrgMember } from "@/lib/interface";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";

interface OrgMembersMultiSelectProps {
    orgId: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    hideChevron?: boolean;
    hideBadges?: boolean;
    ownerId?: string;
}

export function OrgMembersMultiSelect({
    orgId,
    value,
    onChange,
    placeholder = "Chọn thành viên",
    hideChevron,
    hideBadges,
    ownerId,
}: OrgMembersMultiSelectProps) {
    const { data: membersResponse, isLoading } = useOrgMembers(orgId);
    const members = membersResponse?.content || [];
    if (isLoading) {
        return <Skeleton className="h-10 w-full rounded-xl" />;
    }

    const options = ownerId
        ? members
              .filter((member: OrgMember) => member.profileId !== ownerId)
              .map((member: OrgMember) => ({
                  value: member.profileId,
                  label: member.fullName,
                  avatar: member.avatar,
                  showAvatar: true,
              }))
        : members.map((member: OrgMember) => ({
              value: member.profileId,
              label: member.fullName,
              avatar: member.avatar,
              showAvatar: true,
          }));

    // Tạo component tùy chỉnh để hiển thị avatar thay vì badge
    const renderSelectedMembers = () => {
        if (value.length === 0)
            return <div className="truncate">{placeholder}</div>;

        const selectedMembers = value
            .map((id) =>
                members.find((member: OrgMember) => member.profileId === id)
            )
            .filter(Boolean);

        return (
            <div className="flex items-center gap-1">
                <div className="flex -space-x-2">
                    {selectedMembers.map((member: any, idx) => (
                        <div key={member.profileId}>
                            <Avatar
                                name={getFirstAndLastWord(member.fullName)}
                                size="20"
                                round
                                className="object-cover border-white"
                                style={{
                                    zIndex: 10 - idx,
                                }}
                                src={getAvatarUrl(member.avatar) || ""}
                            />
                        </div>
                    ))}
                </div>
                {value.length > 0 && (
                    <span className="text-xs ml-1 font-medium">
                        {value.length} thành viên
                    </span>
                )}
            </div>
        );
    };

    return (
        <MultiSelect
            options={options}
            selected={value}
            onChange={onChange}
            placeholder={placeholder}
            hideChevron={hideChevron}
            hideBadges={true}
            buttonClassName="overflow-hidden"
            textClassName="truncate"
            renderSelectedItems={renderSelectedMembers}
        />
    );
}
