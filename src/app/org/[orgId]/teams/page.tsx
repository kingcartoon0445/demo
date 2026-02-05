"use client";
import { Glass } from "@/components/Glass";
import { getTeamListV2 } from "@/api/teamV2";
import { CustomTooltip } from "@/components/custom_tooltip";
import TeamAddMember from "@/components/deals/team_add_member";
import TeamCreateDialog from "@/components/deals/team_create";
import { TeamDetail } from "@/components/deals/team_detail";
import { ExpansionTileList } from "@/components/deals/team_list";
import TeamRouteConfig from "@/components/deals/team_route_config";
import TeamUpdateDialog from "@/components/deals/team_update";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    useAddMembersToTeamList,
    useTeamCreate,
    useTeamList,
    useTeamListRefresh,
    useTeamSelected,
    useTeamUpdate,
} from "@/hooks/team_data";
import { useDebounce } from "@/hooks/useDebounce";
import { findBranchWithParentId } from "@/lib/utils";
import {
    useParams,
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { MdAdd } from "react-icons/md";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useOrgStore } from "@/store/useOrgStore";
import { useUserDetail } from "@/hooks/useUser";

export default function TeamsPage() {
    const { orgId } = useParams();
    const { permissions, isManager } = useUserPermissions(orgId as string);
    const { orgDetail } = useOrgStore();
    const { data: currentUser } = useUserDetail(orgId as string);
    const { t } = useLanguage();
    const { teamList, setTeamList } = useTeamList();
    const { selectedTeam, setSelectedTeam } = useTeamSelected();
    const [searchTeam, setSearchTeam] = useState("");
    const [debouncedSearchTeam] = useDebounce(searchTeam, 200);
    const [filteredTeamList, setFilteredTeamList] = useState([]);
    const searchParams = useSearchParams();
    const teamId = searchParams.get("teamId");
    const { orgId } = useParams();
    const {
        updateTeamData,
        openTeamUpdate,
        setUpdateTeam,
        setOpenTeamUpdate,
        openTeamRouteConfig,
        setOpenTeamRouteConfig,
    } = useTeamUpdate();

    const pathname = usePathname();
    const router = useRouter();
    const { openTeamCreate, setOpenTeamCreate, parentId, setParentId } =
        useTeamCreate();
    const { openAddMembers, setOpenAddMembers } = useAddMembersToTeamList();
    const { refreshList, setRefreshList } = useTeamListRefresh(); // Permission checks
    const canCreateTeam = useMemo(() => {
        return isManager || permissions.has("TEAM.CREATE");
    }, [isManager, permissions]);

    const canDeleteTeam = useMemo(() => {
        // Check if user is manager or has TEAM.DELETE permission
        const hasGeneralPermission =
            isManager || permissions.has("TEAM.DELETE");

        // Check if user is TEAM_LEADER of the selected team
        const isTeamLeader = selectedTeam?.managers?.some(
            (manager: any) =>
                manager.profileId === currentUser?.id &&
                manager.role === "TEAM_LEADER",
        );

        return hasGeneralPermission || isTeamLeader;
    }, [isManager, permissions, selectedTeam, currentUser]);

    const canAddMember = useMemo(() => {
        // Check if user is manager
        const isOrgManager = isManager;

        // Check if user is TEAM_LEADER of the selected team
        const isTeamLeader = selectedTeam?.managers?.some(
            (manager: any) =>
                manager.profileId === currentUser?.id &&
                manager.role === "TEAM_LEADER",
        );

        return isOrgManager || isTeamLeader;
    }, [isManager, selectedTeam, currentUser]);
    useEffect(() => {
        setTeamList([]);
        setSelectedTeam(undefined);
    }, [orgId]);

    useEffect(() => {
        const searchTeam = (teamList: any, searchTerm: any) => {
            if (!searchTerm) {
                return teamList;
            }
            return teamList.filter((team: any) =>
                team.name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        };

        setFilteredTeamList(searchTeam(teamList, debouncedSearchTeam));
    }, [debouncedSearchTeam, teamList]);
    useEffect(() => {
        getTeamListV2(orgId as string, {
            offset: 0,
            limit: 1000,
            search: debouncedSearchTeam,
        }).then((res: any) => {
            if (res?.code != 0) return toast.error(res?.message);
            setTeamList(res.content);
            setFilteredTeamList(res.content);
        });
    }, [refreshList, debouncedSearchTeam, orgId]);
    useEffect(() => {
        if (teamList.length != 0 && teamId) {
            setSelectedTeam(findBranchWithParentId(teamList, teamId));
        }
    }, [teamList, teamId]);
    return (
        <div className="flex h-full w-full p-1 gap-6  ">
            {openTeamCreate && (
                <TeamCreateDialog
                    teamId={parentId}
                    open={openTeamCreate}
                    setOpen={setOpenTeamCreate}
                    setRefresh={setRefreshList}
                    orgId={orgId}
                    workspaceId={null}
                    teamList={teamList}
                />
            )}
            {openTeamUpdate && (
                <TeamUpdateDialog
                    updateTeamData={updateTeamData}
                    open={openTeamUpdate}
                    setOpen={setOpenTeamUpdate}
                    setRefresh={setRefreshList}
                    orgId={orgId}
                />
            )}
            {openTeamRouteConfig && (
                <TeamRouteConfig
                    item={updateTeamData}
                    open={openTeamRouteConfig}
                    setOpen={setOpenTeamRouteConfig}
                    setRefresh={setRefreshList}
                />
            )}
            {openAddMembers && teamId && (
                <TeamAddMember
                    open={openAddMembers}
                    setOpen={setOpenAddMembers}
                    orgId={orgId}
                />
            )}

            <Glass
                intensity="high"
                className="w-[380px] 2xl:w-[470px] h-full flex flex-col overflow-hidden rounded-2xl"
            >
                <div className="w-full min-h-[72px] border-b border-white/20">
                    <div className="flex items-center justify-between p-4 w-full">
                        <div className="font-medium px-3 py-2 text-lg">
                            Đội sale
                        </div>
                        <div className="flex items-center gap-2">
                            {canCreateTeam && (
                                <CustomTooltip label={"Thêm đội sale"}>
                                    <Button
                                        onClick={() => {
                                            setParentId("");
                                            setOpenTeamCreate(true);
                                        }}
                                        className={
                                            "flex items-center gap-1 h-[35px] px-[10px]"
                                        }
                                    >
                                        <MdAdd className="text-xl" />
                                        Thêm mới
                                    </Button>
                                </CustomTooltip>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-1 pb-20">
                    <ExpansionTileList
                        childs={teamList}
                        onTap={(e: any) => {
                            router.push(pathname + `?teamId=${e.id}`);
                        }}
                        index={0}
                        style={{}}
                    />
                </div>
            </Glass>

            <div className="flex-1 h-full overflow-hidden rounded-2xl">
                <TeamDetail
                    setSelectedTeam={setSelectedTeam}
                    selectedTeam={selectedTeam}
                    refreshTeamList={setRefreshList}
                    isTeam={
                        selectedTeam?.childs &&
                        selectedTeam?.childs?.length != 0
                    }
                    orgId={orgId}
                    canDelete={canDeleteTeam}
                    canAddMember={canAddMember}
                    canManageMember={canAddMember}
                />
            </div>
        </div>
    );
}
