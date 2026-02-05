import { deleteTeam, updateMemberRole } from "@/api/team";
import {
    deleteManagerFromTeam,
    deleteMemberFromTeam,
    deleteTeamV2,
    getMemberListFromTeamIdV2,
    updateManagerInTeam,
    updateTeamMemberRole,
} from "@/api/teamV2";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomerParams } from "@/hooks/customers_data";
import {
    useAddMembersToTeamList,
    useDetailMemberList,
    useTeamCreate,
    useTeamListRefresh,
    useTeamUpdate,
} from "@/hooks/team_data";
import { cn, getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { BiSolidPencil } from "react-icons/bi";
import {
    MdAdd,
    MdDelete,
    MdManageAccounts,
    MdMoreVert,
    MdOutlineGroupAdd,
    MdOutlinePersonAddAlt,
    MdRoute,
} from "react-icons/md";
import Swal from "sweetalert2";
import { useDebounce } from "use-debounce";
import ConfirmDialog from "../common/ConfirmDialog";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { Glass } from "@/components/Glass";
export function TeamDetail({
    selectedTeam,
    refreshTeamList,
    isTeam,
    orgId,
    setSelectedTeam,
    canDelete,
    canAddMember,
    canManageMember,
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const teamId = searchParams.get("teamId");
    const {
        detailMemberList,
        setDetailMemberList,
        refreshList,
        resetMemberList,
    } = useDetailMemberList();
    const [searchMember, setSearchMember] = useState("");
    const [debouncedSearchMember] = useDebounce(searchMember, 200);
    const [filteredMemberList, setFilteredMemberList] = useState([]);
    const { openTeamCreate, setOpenTeamCreate, parentId, setParentId } =
        useTeamCreate();
    const { setUpdateTeam, setOpenTeamUpdate, setOpenTeamRouteConfig } =
        useTeamUpdate();
    const { workspaceId } = useCustomerParams();
    const { openAddMembers, setOpenAddMembers } = useAddMembersToTeamList();
    const { setRefreshList } = useTeamListRefresh();
    const [isOpenConfirmDialog, setIsOpenConfirmDialog] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: "",
        description: "",
        onConfirm: () => {},
    });
    const [deleteManagerDialog, setDeleteManagerDialog] = useState({
        open: false,
        title: "",
        description: "",
        onConfirm: () => {},
    });
    const { t } = useLanguage();
    const [deleteMemberDialog, setDeleteMemberDialog] = useState({
        open: false,
        title: "",
        description: "",
        onConfirm: () => {},
    });

    const [updateRoleDialog, setUpdateRoleDialog] = useState({
        open: false,
        title: "",
        description: "",
        onConfirm: () => {},
    });

    useEffect(() => {
        resetMemberList();
    }, [orgId]);

    useEffect(() => {
        const searchMember = (memberList, searchTerm) => {
            if (!searchTerm) {
                return memberList;
            }
            return memberList.filter((member) =>
                member.profile.fullName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            );
        };

        setFilteredMemberList(
            searchMember(detailMemberList, debouncedSearchMember),
        );
    }, [debouncedSearchMember]);
    const refreshMemberList = () => {
        setDetailMemberList([]);
        setFilteredMemberList([]);
        if (teamId) {
            getMemberListFromTeamIdV2(orgId, teamId).then((res) => {
                if (res?.code != 0) return toast.error(res?.message);
                setDetailMemberList(res.content);
                setFilteredMemberList(res.content);
            });
        }
    };
    useEffect(() => {
        if (!isTeam) {
            refreshMemberList();
        } else {
            setDetailMemberList(selectedTeam.childs);
        }
    }, [selectedTeam, refreshList]);

    const handleDeleteTeam = async () => {
        const res = await deleteTeamV2(orgId, workspaceId, selectedTeam.id);
        if (res.message) {
            toast.error(res.message);
        } else {
            toast.success("Đội sale đã được xóa");
            router.replace(pathname.replace(searchParams.get("teamId"), ""));
            setSelectedTeam(null);
            setRefreshList();
        }
    };

    const handleDeleteManager = async (profileId) => {
        const res = await deleteManagerFromTeam(orgId, teamId, profileId);
        if (res.message) {
            toast.error(res.message);
        } else {
            toast.success("Trưởng nhóm đã được xóa");
            refreshMemberList();
            setRefreshList();
        }
    };

    const handleUpdateRole = async (profileId, role) => {
        const res = await updateTeamMemberRole(orgId, teamId, profileId, role);
        if (res.message) {
            toast.error(res.message);
        } else {
            toast.success("Phân quyền thành công");
            refreshMemberList();
            refreshTeamList();
        }
    };

    const handleUpdateMangerInTeam = async (profileId) => {
        const res = await updateManagerInTeam(orgId, teamId, profileId);
        if (res.message) {
            toast.error(res.message);
        } else {
            toast.success("Phân quyền thành công");
            refreshMemberList();
            refreshTeamList();
        }
    };

    const handleDeleteMemberFromTeam = async (profileId) => {
        const res = await deleteMemberFromTeam(orgId, teamId, profileId);
        if (res.message) {
            toast.error(res.message);
        } else {
            toast.success("Đã xóa thành viên khỏi team");
            refreshMemberList();
            setRefreshList();
        }
    };

    return (
        <Glass
            intensity="high"
            className="h-full flex-1 flex flex-col rounded-2xl items-center overflow-hidden"
        >
            {!selectedTeam ? (
                <Image
                    alt="empty"
                    src={"/images/members_empty.png"}
                    width={400}
                    height={300}
                    className="w-[60%] h-auto object-contain mt-[5%]"
                />
            ) : (
                <>
                    <div className="w-full border-b-[1px] min-h-[72px] relative">
                        <div className="flex items-center px-4 h-full gap-3 w-full">
                            <Avatar
                                name={getFirstAndLastWord(selectedTeam.name)}
                                size="40"
                                className="object-cover"
                                round
                                src={getAvatarUrl(selectedTeam?.avatar)}
                            />
                            <div className="flex flex-col text-title text-lg font-medium">
                                {selectedTeam.name}
                            </div>
                            <div className="flex gap-1 items-center ml-auto">
                                {canAddMember && (
                                    <>
                                        {detailMemberList?.length == 0 ? (
                                            <DropdownMenu>
                                                <TooltipProvider>
                                                    <Tooltip
                                                        content={t(
                                                            "common.add",
                                                        )}
                                                    >
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant={
                                                                    "outline"
                                                                }
                                                            >
                                                                <MdAdd className="text-2xl" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-56"
                                                >
                                                    <DropdownMenuLabel>
                                                        Thêm đội hoặc thành viên
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setParentId(
                                                                    teamId,
                                                                );
                                                                setOpenTeamCreate(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <MdOutlineGroupAdd className="mr-2 h-4 w-4" />
                                                            <span>Tạo đội</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setOpenAddMembers(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <MdOutlinePersonAddAlt className="mr-2 h-4 w-4" />
                                                            <span>
                                                                Thêm thành viên
                                                            </span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <TooltipProvider>
                                                <Tooltip
                                                    content={t("common.add")}
                                                >
                                                    <Button
                                                        onClick={() => {
                                                            if (isTeam) {
                                                                setParentId(
                                                                    teamId,
                                                                );
                                                                setOpenTeamCreate(
                                                                    true,
                                                                );
                                                            } else {
                                                                setOpenAddMembers(
                                                                    true,
                                                                );
                                                            }
                                                        }}
                                                        variant={"outline"}
                                                    >
                                                        <MdAdd className="text-2xl" />
                                                    </Button>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </>
                                )}
                                {(canAddMember || canDelete) && (
                                    <DropdownMenu
                                        onOpenChange={(isOpen) => {
                                            if (isOpen) {
                                                setUpdateTeam(selectedTeam);
                                            }
                                        }}
                                    >
                                        <TooltipProvider>
                                            <Tooltip
                                                content={t("common.extend")}
                                            >
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant={"outline"}>
                                                        <MdMoreVert className="text-2xl" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <DropdownMenuContent>
                                            {selectedTeam?.childs &&
                                                selectedTeam?.childs?.length !=
                                                    0 &&
                                                canAddMember && (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setParentId(
                                                                selectedTeam.id,
                                                            );
                                                            setOpenTeamCreate(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <MdAdd />
                                                        Tạo team con
                                                    </DropdownMenuItem>
                                                )}
                                            {canAddMember && (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setOpenTeamUpdate(true);
                                                    }}
                                                >
                                                    <BiSolidPencil />
                                                    Chỉnh sửa team
                                                </DropdownMenuItem>
                                            )}
                                            {/* <DropdownMenuItem
                                                onClick={() => {
                                                    setParentId(selectedTeam.id);
                                                    setOpenTeamRouteConfig(true);
                                                }}
                                            >
                                                <MdRoute />
                                                Cấu hình định tuyến
                                            </DropdownMenuItem> */}
                                            {canDelete && (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setIsOpenConfirmDialog(
                                                            true,
                                                        );
                                                        setConfirmDialog({
                                                            open: true,
                                                            title: `Bạn muốn xóa đội sale ${selectedTeam.name}?`,
                                                            description:
                                                                "Bạn sẽ không thể hoàn lại thao tác này",
                                                            onConfirm:
                                                                handleDeleteTeam,
                                                        });
                                                    }}
                                                >
                                                    <MdDelete />
                                                    Xóa team
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="h-full w-full px-4 flex">
                        <div className="flex flex-col items-start w-full mt-2 gap-3 overflow-y-auto">
                            {selectedTeam?.managers?.map((e, i) => (
                                <>
                                    <div
                                        key={i}
                                        className="flex items-center justify-between gap-3 cursor-pointer w-full"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                name={getFirstAndLastWord(
                                                    e?.fullName,
                                                )}
                                                size="38"
                                                className="object-cover"
                                                round
                                                src={getAvatarUrl(e?.avatar)}
                                            />
                                            <div className="flex flex-col leading-[1.4]">
                                                <div className="font-medium text-[16px]">
                                                    {e?.fullName}
                                                </div>
                                                <div className="text-[14px] text-text2">
                                                    {e?.role == "TEAM_LEADER"
                                                        ? "Trưởng nhóm"
                                                        : "Phó nhóm"}{" "}
                                                    • {e?.email}
                                                </div>
                                            </div>
                                        </div>
                                        {canManageMember && (
                                            <DropdownMenu>
                                                <TooltipProvider>
                                                    <Tooltip
                                                        content={t(
                                                            "common.extend",
                                                        )}
                                                    >
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant={
                                                                    "outline"
                                                                }
                                                            >
                                                                <MdMoreVert className="text-2xl" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <MdManageAccounts className="mr-2 h-4 w-4" />
                                                            <span>
                                                                Phân quyền
                                                            </span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent>
                                                                {e?.role ==
                                                                    "MEMBER" && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setUpdateRoleDialog(
                                                                                {
                                                                                    open: true,
                                                                                    title: `Đặt làm trưởng nhóm`,
                                                                                    description: `Bạn có chắc muốn đặt ${e?.fullName} làm trưởng nhóm?`,
                                                                                    onConfirm:
                                                                                        () => {
                                                                                            handleUpdateRole(
                                                                                                e?.profileId,
                                                                                                "TEAM_LEADER",
                                                                                            );
                                                                                        },
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        <span>
                                                                            Trưởng
                                                                            nhóm
                                                                        </span>
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setUpdateRoleDialog(
                                                                            {
                                                                                open: true,
                                                                                title: `Đặt làm thành viên`,
                                                                                description: `Bạn có chắc muốn đặt ${e?.fullName} làm thành viên?`,
                                                                                onConfirm:
                                                                                    () => {
                                                                                        handleUpdateRole(
                                                                                            e?.profileId,
                                                                                            "MEMBER",
                                                                                        );
                                                                                    },
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <span>
                                                                        Thành
                                                                        viên
                                                                    </span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setDeleteManagerDialog(
                                                                {
                                                                    open: true,
                                                                    title: `Bạn muốn xóa ${e?.fullName} ra khỏi đội sale này?`,
                                                                    text: "Bạn sẽ không thể hoàn lại thao tác này",
                                                                    onConfirm:
                                                                        () => {
                                                                            handleDeleteManager(
                                                                                e?.profileId,
                                                                            );
                                                                        },
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <MdDelete className="mr-2 h-4 w-4" />
                                                        <span>
                                                            Xóa trưởng nhóm
                                                        </span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </>
                            ))}
                            {selectedTeam?.managers &&
                                selectedTeam?.managers?.length != 0 && (
                                    <div className="border-b-[1px] w-full my-1" />
                                )}
                            {detailMemberList?.map((e, i) => (
                                <div
                                    key={i}
                                    className="flex items-center cursor-pointer w-full "
                                >
                                    <div
                                        onClick={() => {
                                            if (isTeam) {
                                                router.push(
                                                    pathname +
                                                        `?teamId=${e.id}`,
                                                );
                                            }
                                        }}
                                        className="flex items-center gap-3 flex-1"
                                    >
                                        <Avatar
                                            name={getFirstAndLastWord(
                                                isTeam
                                                    ? e?.name
                                                    : e?.profile?.fullName,
                                            )}
                                            size="38"
                                            className="object-cover"
                                            round
                                            src={getAvatarUrl(
                                                e?.profile?.avatar,
                                            )}
                                        />
                                        <div className="flex flex-col leading-[1.4]">
                                            <div className="font-medium text-[16px]">
                                                {isTeam
                                                    ? e?.name
                                                    : e?.profile?.fullName}
                                            </div>
                                            <div className="text-[14px] text-text2">
                                                {isTeam
                                                    ? (e?.managers?.[0]
                                                          ?.fullName ??
                                                      "Chưa có trưởng nhóm")
                                                    : "Thành viên"}{" "}
                                                • {e?.profile?.email}
                                            </div>
                                        </div>
                                    </div>

                                    {isTeam
                                        ? (canAddMember || canDelete) && (
                                              <DropdownMenu
                                                  onOpenChange={(isOpen) => {
                                                      if (isOpen) {
                                                          setUpdateTeam(e);
                                                      }
                                                  }}
                                              >
                                                  <TooltipProvider>
                                                      <Tooltip
                                                          content={t(
                                                              "common.extend",
                                                          )}
                                                      >
                                                          <DropdownMenuTrigger
                                                              asChild
                                                          >
                                                              <Button
                                                                  variant={
                                                                      "outline"
                                                                  }
                                                              >
                                                                  <MdMoreVert className="text-2xl" />
                                                              </Button>
                                                          </DropdownMenuTrigger>
                                                      </Tooltip>
                                                  </TooltipProvider>
                                                  <DropdownMenuContent>
                                                      {canAddMember && (
                                                          <DropdownMenuItem
                                                              onClick={() => {
                                                                  setOpenTeamUpdate(
                                                                      true,
                                                                  );
                                                              }}
                                                          >
                                                              <BiSolidPencil />
                                                              Chỉnh sửa team
                                                          </DropdownMenuItem>
                                                      )}
                                                      <DropdownMenuItem
                                                          onClick={() => {
                                                              setParentId(e.id);
                                                              setOpenTeamRouteConfig(
                                                                  true,
                                                              );
                                                          }}
                                                      >
                                                          <MdRoute />
                                                          Cấu hình định tuyến
                                                      </DropdownMenuItem>
                                                      {canDelete && (
                                                          <DropdownMenuItem
                                                              onClick={() => {
                                                                  Swal.fire({
                                                                      title: `Bạn muốn xóa đội sale ${e.name}?`,
                                                                      text: "Bạn sẽ không thể hoàn lại thao tác này",
                                                                      icon: "warning",
                                                                      showCancelButton: true,
                                                                      confirmButtonColor:
                                                                          "#d33",
                                                                      cancelButtonText:
                                                                          "Hủy",
                                                                      confirmButtonText:
                                                                          "Đồng ý",
                                                                      preConfirm:
                                                                          async () => {
                                                                              try {
                                                                                  const response =
                                                                                      await deleteTeam(
                                                                                          orgId,
                                                                                          workspaceId,
                                                                                          e.id,
                                                                                      );
                                                                                  return response;
                                                                              } catch (e) {
                                                                                  toast.error(
                                                                                      e,
                                                                                  );
                                                                              }
                                                                          },
                                                                  }).then(
                                                                      (
                                                                          result,
                                                                      ) => {
                                                                          const response =
                                                                              result.value;
                                                                          if (
                                                                              response.message
                                                                          )
                                                                              return toast.error(
                                                                                  response.message,
                                                                                  {
                                                                                      position:
                                                                                          "top-center",
                                                                                  },
                                                                              );
                                                                          if (
                                                                              teamId ==
                                                                              e.id
                                                                          ) {
                                                                              router.replace(
                                                                                  pathname.replace(
                                                                                      searchParams.get(
                                                                                          "teamId",
                                                                                      ),
                                                                                      "",
                                                                                  ),
                                                                              );
                                                                          }
                                                                          setRefreshList();
                                                                          if (
                                                                              result.isConfirmed
                                                                          ) {
                                                                              Swal.fire(
                                                                                  {
                                                                                      title: "Thành công!",
                                                                                      text: "Khách hàng đã bị xóa khỏi hệ thống",
                                                                                      icon: "success",
                                                                                  },
                                                                              );
                                                                          }
                                                                      },
                                                                  );
                                                              }}
                                                          >
                                                              <MdDelete />
                                                              Xóa team
                                                          </DropdownMenuItem>
                                                      )}
                                                  </DropdownMenuContent>
                                              </DropdownMenu>
                                          )
                                        : canManageMember && (
                                              <DropdownMenu>
                                                  <TooltipProvider>
                                                      <Tooltip
                                                          content={t(
                                                              "common.extend",
                                                          )}
                                                      >
                                                          <DropdownMenuTrigger
                                                              asChild
                                                          >
                                                              <Button
                                                                  variant={
                                                                      "outline"
                                                                  }
                                                              >
                                                                  <MdMoreVert className="text-2xl" />
                                                              </Button>
                                                          </DropdownMenuTrigger>
                                                      </Tooltip>
                                                  </TooltipProvider>
                                                  <DropdownMenuContent
                                                      align="end"
                                                      className="w-44"
                                                  >
                                                      <DropdownMenuSub>
                                                          <DropdownMenuSubTrigger>
                                                              <MdManageAccounts className="mr-2 h-4 w-4" />
                                                              <span>
                                                                  Phân quyền
                                                              </span>
                                                          </DropdownMenuSubTrigger>
                                                          <DropdownMenuPortal>
                                                              <DropdownMenuSubContent>
                                                                  <DropdownMenuItem
                                                                      onClick={() => {
                                                                          setUpdateRoleDialog(
                                                                              {
                                                                                  open: true,
                                                                                  title: `Đặt làm trưởng nhóm`,
                                                                                  description: `Bạn có chắc muốn đặt ${e?.profile?.fullName} làm trưởng nhóm?`,
                                                                                  onConfirm:
                                                                                      () => {
                                                                                          handleUpdateMangerInTeam(
                                                                                              e?.profileId,
                                                                                          );
                                                                                      },
                                                                              },
                                                                          );
                                                                      }}
                                                                  >
                                                                      <span>
                                                                          Trưởng
                                                                          nhóm
                                                                      </span>
                                                                  </DropdownMenuItem>
                                                                  <DropdownMenuItem
                                                                      onClick={() => {
                                                                          setUpdateRoleDialog(
                                                                              {
                                                                                  open: true,
                                                                                  title: `Đặt làm thành viên`,
                                                                                  description: `Bạn có chắc muốn đặt ${e?.profile?.fullName} làm thành viên?`,
                                                                                  onConfirm:
                                                                                      () => {
                                                                                          handleUpdateRole(
                                                                                              e?.profileId,
                                                                                              "MEMBER",
                                                                                          );
                                                                                      },
                                                                              },
                                                                          );
                                                                      }}
                                                                  >
                                                                      <span>
                                                                          Thành
                                                                          viên
                                                                      </span>
                                                                  </DropdownMenuItem>
                                                              </DropdownMenuSubContent>
                                                          </DropdownMenuPortal>
                                                      </DropdownMenuSub>

                                                      <DropdownMenuItem
                                                          onClick={() => {
                                                              setDeleteMemberDialog(
                                                                  {
                                                                      open: true,
                                                                      title: `Bạn muốn xóa thành viên ${e?.profile?.fullName}?`,
                                                                      description:
                                                                          "Bạn sẽ không thể hoàn lại thao tác này",
                                                                      onConfirm:
                                                                          () =>
                                                                              handleDeleteMemberFromTeam(
                                                                                  e?.profileId,
                                                                              ),
                                                                  },
                                                              );
                                                          }}
                                                      >
                                                          <MdDelete className="mr-2 h-4 w-4" />
                                                          <span>
                                                              Xóa thành viên
                                                          </span>
                                                      </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                              </DropdownMenu>
                                          )}
                                </div>
                            ))}
                        </div>
                    </div>
                    {isOpenConfirmDialog && (
                        <ConfirmDialog
                            isOpen={isOpenConfirmDialog}
                            onClose={() => setIsOpenConfirmDialog(false)}
                            onConfirm={confirmDialog.onConfirm}
                            title={confirmDialog.title}
                            description={confirmDialog.description}
                        />
                    )}
                    {deleteManagerDialog.open && (
                        <ConfirmDialog
                            isOpen={deleteManagerDialog.open}
                            onClose={() =>
                                setDeleteManagerDialog({ open: false })
                            }
                            onConfirm={deleteManagerDialog.onConfirm}
                            title={deleteManagerDialog.title}
                            description={deleteManagerDialog.description}
                        />
                    )}
                    {deleteMemberDialog.open && (
                        <ConfirmDialog
                            isOpen={deleteMemberDialog.open}
                            onClose={() =>
                                setDeleteMemberDialog({ open: false })
                            }
                            onConfirm={deleteMemberDialog.onConfirm}
                            title={deleteMemberDialog.title}
                            description={deleteMemberDialog.description}
                        />
                    )}

                    {updateRoleDialog.open && (
                        <ConfirmDialog
                            isOpen={updateRoleDialog.open}
                            onClose={() => setUpdateRoleDialog({ open: false })}
                            onConfirm={updateRoleDialog.onConfirm}
                            title={updateRoleDialog.title}
                            description={updateRoleDialog.description}
                        />
                    )}
                </>
            )}
        </Glass>
    );
}
