"use client";
import { getOrgMemberDetail } from "@/api/org";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";

export default function ProfilePopover({
    profileId,
    children,
}: {
    profileId: string;
    children: React.ReactNode;
}) {
    return (
        <Popover>
            <PopoverTrigger>
                <span>{children}</span>
            </PopoverTrigger>
            <PopoverContent className="p-0 rounded-xl">
                <ProfileInfo profileId={profileId} />
            </PopoverContent>
        </Popover>
    );
}

const ProfileInfo = ({ profileId }: { profileId: string }) => {
    const { orgId } = useParams();
    const router = useRouter();
    const {
        data: profile,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["profile", profileId],
        queryFn: () => getOrgMemberDetail(profileId, orgId),
    });

    if (profileId === "BOT" || profileId === "SYSTEM") {
        const fullName = "BOT";
        const avatar = "/images/bot.png";
        return (
            <div className="flex flex-col items-center p-4 w-[320px]">
                <Image
                    src={avatar}
                    alt="BOT"
                    width={60}
                    height={60}
                    className="object-contain border rounded-full p-2"
                />
                <h2 className="text-xl font-bold mt-2">{fullName}</h2>
                <div></div>
            </div>
        );
    }

    if (isLoading) return <div>Loading...</div>;
    if (isError || !profile || profile.code !== 0)
        return <div>Error loading profile</div>;

    const { fullName, email, address, avatar, phone, position } =
        profile.content;

    return (
        <div className="flex flex-col items-center p-4 relative">
            <Avatar
                src={getAvatarUrl(avatar) || undefined}
                name={getFirstAndLastWord(fullName)}
                size="60"
                round={true}
                className="object-cover border"
            />
            <h2 className="text-xl font-bold mt-2">{fullName}</h2>
            <div className="flex flex-col w-full mt-6 gap-2">
                <Label label="Điện thoại" value={phone} />
                <Label label="Email" value={email} />
                <Label label="Địa chỉ" value={address} />
                <Label label="Chức vụ" value={position} />
            </div>
            <Button
                className="w-full h-[30px] mt-4"
                onClick={() =>
                    router.push(`/org/${orgId}/members?id=${profileId}`)
                }
            >
                Xem chi tiết
            </Button>
        </div>
    );
};

const Label = ({ label, value }: { label: string; value: string }) => {
    return (
        <p className=" flex justify-between font-medium text-sm">
            <span className="w-[100px] inline-block text-start font-light">
                {label}
            </span>{" "}
            <span className="text-end w-[230px] break-all">{value}</span>
        </p>
    );
};
