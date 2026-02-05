import { getTeamListV2 } from "@/api/teamV2";
import { useTeamList } from "@/hooks/team_data";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useGetTeamListV2(orgId: string, params: any = {}) {
    // @ts-ignore
    const { setTeamList } = useTeamList();

    const query = useQuery({
        queryKey: ["team-list-v2", orgId, params],
        queryFn: () => getTeamListV2(orgId, params),
        enabled: !!orgId,
    });

    useEffect(() => {
        if (query.data) {
            // Check if data has content property (common in this project's API responses)
            // or return data directly if it is the array
            const dataToSet = (query.data as any).content || query.data;
            setTeamList(dataToSet);
        }
    }, [query.data, setTeamList]);

    return query;
}
