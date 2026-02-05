// import { getTeamListV2 } from "@/api/teamV2";
// import { CustomTooltip } from "@/components/custom_tooltip";
// import { Button } from "@/components/ui/button";
// import { useLanguage } from "@/contexts/LanguageContext";
// import {
//     useAddMembersToTeamList,
//     useTeamCreate,
//     useTeamList,
//     useTeamListRefresh,
//     useTeamSelected,
//     useTeamUpdate,
// } from "@/hooks/team_data";
// import { findBranchWithParentId } from "@/lib/utils";
// import { usePathname, useRouter, useSearchParams } from "next/navigation";
// import { useEffect, useState } from "react";
// import toast from "react-hot-toast";
// import { MdAdd, MdRoute } from "react-icons/md";
// import { useDebounce } from "use-debounce";
// import { Dialog, DialogContent } from "../ui/dialog";
// import TeamAddMember from "./team_add_member";
// import TeamCreateDialog from "./team_create";
// import { TeamDetail } from "./team_detail";
// import { ExpansionTileList } from "./team_list";
// import TeamRouteConfig from "./team_route_config";
// import TeamUpdateDialog from "./team_update";

// export default function TeamSaleModal({
//     isOpen,
//     onClose,
//     orgId,
//     workspaceId,
// }: {
//     isOpen: boolean;
//     onClose: () => void;
//     orgId: string;
//     workspaceId: string;
// }) {
//     const { t } = useLanguage();
//     const { teamList, setTeamList } = useTeamList();
//     const { selectedTeam, setSelectedTeam } = useTeamSelected();
//     const [searchTeam, setSearchTeam] = useState("");
//     const [debouncedSearchTeam] = useDebounce(searchTeam, 200);
//     const [filteredTeamList, setFilteredTeamList] = useState([]);
//     const searchParams = useSearchParams();
//     const teamId = searchParams.get("teamId");
//     const {
//         updateTeamData,
//         openTeamUpdate,
//         setUpdateTeam,
//         setOpenTeamUpdate,
//         openTeamRouteConfig,
//         setOpenTeamRouteConfig,
//     } = useTeamUpdate();

//     const pathname = usePathname();
//     const router = useRouter();
//     const { openTeamCreate, setOpenTeamCreate, parentId, setParentId } =
//         useTeamCreate();
//     const { openAddMembers, setOpenAddMembers } = useAddMembersToTeamList();
//     const { refreshList, setRefreshList } = useTeamListRefresh();
//     useEffect(() => {
//         setTeamList([]);
//         setSelectedTeam(undefined);
//     }, [orgId]);

//     useEffect(() => {
//         const searchTeam = (teamList: any, searchTerm: any) => {
//             if (!searchTerm) {
//                 return teamList;
//             }
//             return teamList.filter((team: any) =>
//                 team.name.toLowerCase().includes(searchTerm.toLowerCase())
//             );
//         };

//         setFilteredTeamList(searchTeam(teamList, debouncedSearchTeam));
//     }, [debouncedSearchTeam, teamList]);
//     useEffect(() => {
//         if (workspaceId) {
//             getTeamListV2(orgId, workspaceId, {
//                 offset: 0,
//                 limit: 1000,
//                 search: debouncedSearchTeam,
//             }).then((res: any) => {
//                 if (res?.code != 0) return toast.error(res?.message);
//                 setTeamList(res.content);
//                 setFilteredTeamList(res.content);
//             });
//         }
//     }, [workspaceId, refreshList, debouncedSearchTeam, orgId]);
//     useEffect(() => {
//         if (teamList.length != 0 && teamId) {
//             setSelectedTeam(findBranchWithParentId(teamList, teamId));
//         }
//     }, [teamList, teamId]);

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent
//                 showCloseButton={false}
//                 className="min-w-[90vw] max-h-[90vh] overflow-hidden p-0 custom-scrollbar"
//             >
//                 <div className="flex flex-col h-full flex-1 border-[#E4E7EC]">
//                     {openTeamCreate && (
//                         <TeamCreateDialog
//                             teamId={parentId}
//                             open={openTeamCreate}
//                             setOpen={setOpenTeamCreate}
//                             setRefresh={setRefreshList}
//                             orgId={orgId}
//                             workspaceId={workspaceId}
//                         />
//                     )}
//                     {openTeamUpdate && (
//                         <TeamUpdateDialog
//                             updateTeamData={updateTeamData}
//                             open={openTeamUpdate}
//                             setOpen={setOpenTeamUpdate}
//                             setRefresh={setRefreshList}
//                             orgId={orgId}
//                         />
//                     )}
//                     {openTeamRouteConfig && (
//                         <TeamRouteConfig
//                             item={updateTeamData}
//                             open={openTeamRouteConfig}
//                             setOpen={setOpenTeamRouteConfig}
//                             setRefresh={setRefreshList}
//                         />
//                     )}
//                     {openAddMembers && teamId && (
//                         <TeamAddMember
//                             open={openAddMembers}
//                             setOpen={setOpenAddMembers}
//                             orgId={orgId}
//                         />
//                     )}
//                     <div className="w-full h-full overflow-hidden flex border-t-[1px] ">
//                         <div className="border-r-[1px] flex flex-col">
//                             <div className="w-[380px] 2xl:w-[470px] min-h-[72px] border-b-[1px]">
//                                 <div className="flex items-center justify-between p-4 w-full">
//                                     <div className="font-medium px-3 py-2">
//                                         Đội sale
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <CustomTooltip label={"Thêm đội sale"}>
//                                             <Button
//                                                 onClick={() => {
//                                                     setParentId("");
//                                                     setOpenTeamCreate(true);
//                                                 }}
//                                                 className={
//                                                     "flex items-center gap-1 h-[35px] px-[10px]"
//                                                 }
//                                             >
//                                                 <MdAdd className="text-xl" />
//                                                 Thêm mới
//                                             </Button>
//                                         </CustomTooltip>
//                                         {/* <CustomTooltip
//                                             label={"Cấu hình định tuyến"}
//                                         >
//                                             <CustomButton
//                                                 onClick={() => {
//                                                     setUpdateTeam(undefined);
//                                                     setOpenTeamRouteConfig(
//                                                         true
//                                                     );
//                                                 }}
//                                                 isActive={true}
//                                             >
//                                                 <MdRoute className="text-2xl" />
//                                             </CustomButton>
//                                         </CustomTooltip> */}
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="overflow-y-scroll h-[calc(100vh-100px)] pb-20">
//                                 <ExpansionTileList
//                                     childs={teamList}
//                                     onTap={(e: any) => {
//                                         router.push(
//                                             pathname + `?teamId=${e.id}`
//                                         );
//                                     }}
//                                     index={0}
//                                     style={{}}
//                                 />
//                             </div>
//                             {/* <CustomerList /> */}
//                         </div>
//                         <TeamDetail
//                             selectedTeam={selectedTeam}
//                             refreshTeamList={setRefreshList}
//                             isTeam={
//                                 selectedTeam?.childs &&
//                                 selectedTeam?.childs?.length != 0
//                             }
//                             orgId={orgId}
//                         />
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// }
// const CustomButton = ({
//     children,
//     onClick,
//     isActive,
// }: {
//     children: any;
//     onClick: any;
//     isActive: any;
// }) => (
//     <Button
//         variant={isActive ? "default" : "outline"}
//         onClick={onClick}
//         className={`p-0 rounded-lg border-none ${
//             isActive ? "fill-white" : "fill-[#1F2329]"
//         }  w-[40px] h-[40px] flex items-center justify-center`}
//     >
//         {children}
//     </Button>
// );
