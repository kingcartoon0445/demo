import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getAccessToken } from "@/lib/authCookies";
import { getProfile } from "@/api/auth";
import { getUserProfileDetail, updateProfile } from "@/api/user";
import { toast } from "react-hot-toast";
export interface User {
    id: string;
    fullName: string;
    email: string;
    dob: string;
    gender: number;
    about: string;
    address: string;
    position: string;
    avatar: string;
    cover: string;
    isVerifyPhone: boolean;
    isVerifyEmail: boolean;
    isFcm: boolean;
}

export function useUserDetail(orgIdInput?: string) {
    const params = useParams();
    const orgId =
        orgIdInput ??
        (Array.isArray(params?.orgId) ? params?.orgId[0] : params?.orgId);

    return useQuery({
        queryKey: ["user-detail", orgId],
        queryFn: () => getProfile(orgId),
        enabled: !!getAccessToken(),
        staleTime: 0, // 5 minutes
        // Prevent serving stale data when user logs out
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });
}

export function useUserUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProfile,
        onSuccess: (res: any) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({ queryKey: ["user-detail"] });
                toast.success("Cập nhật thông tin thành công");
            } else {
                toast.error(res.message);
            }
        },
        onError: () => {
            toast.error("Cập nhật thông tin thất bại");
        },
    });
}

export function useUserProfileDetail(orgId: string, profileId: string) {
    return useQuery({
        queryKey: ["user-profile-detail", orgId, profileId],
        queryFn: () => getUserProfileDetail(orgId, profileId),
        enabled: !!orgId && !!profileId,
        staleTime: 0, // 5 minutes
    });
}
