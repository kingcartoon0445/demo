import { deleteTeam } from "@/api/team";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCustomerParams } from "@/hooks/customers_data";
import {
    useTeamCreate,
    useTeamListRefresh,
    useTeamUpdate,
} from "@/hooks/team_data";
import { cn, getFirstAndLastWord } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { BiSolidPencil } from "react-icons/bi";
import { IoMdArrowDropdown } from "react-icons/io";
import { MdAdd, MdDelete, MdOutlineRoute, MdRoute } from "react-icons/md";
import Swal from "sweetalert2";

export const ExpansionTileList = ({ childs, onTap, style, index }) => {
    return childs?.map((e) => {
        const childs_1 = e.childs || [];
        return (
            <CExpansionTile
                key={e.id}
                child={e}
                childs={childs_1}
                onTap={onTap}
                style={style}
                index={index + 1}
            />
        );
    });
};

const CExpansionTile = ({ child, childs, onTap, style, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { setOpenTeamCreate, setParentId } = useTeamCreate();
    const { setUpdateTeam, setOpenTeamUpdate, setOpenTeamRouteConfig } =
        useTeamUpdate();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const teamId = searchParams.get("teamId");
    const name = child.name;
    const managers = child.managers || [];
    const { orgId, workspaceId } = useCustomerParams();
    const { setRefreshList } = useTeamListRefresh();

    useEffect(() => {
        if (teamId == child.id) {
        }
    }, [teamId]);
    return (
        <div className="flex flex-col cursor-pointer">
            <ContextMenu
                onOpenChange={(isOpen) => {
                    if (isOpen) {
                        setUpdateTeam(child);
                    }
                }}
            >
                <ContextMenuTrigger asChild>
                    <div
                        className={cn(
                            `flex items-center p-2 border-b border-gray-100 cursor-pointer transition-all duration-200`,
                            teamId == child.id
                                ? "bg-white border-l-4 border-l-blue-600 outline-none"
                                : "hover:bg-gray-50 border-l-4 border-l-transparent",
                        )}
                        onClick={() => {
                            if (!isExpanded) {
                                setIsExpanded(!isExpanded);
                            }
                            onTap(child);
                        }}
                    >
                        <div
                            className="w-[37px] flex items-center justify-center"
                            style={style}
                        >
                            {childs.length != 0 && (
                                <div
                                    className={cn(
                                        `text-2xl transition-transform ${
                                            isExpanded
                                                ? "rotate-0"
                                                : "-rotate-90"
                                        }`,
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsExpanded(!isExpanded);
                                    }}
                                >
                                    <IoMdArrowDropdown />
                                </div>
                            )}
                        </div>

                        <Avatar
                            name={getFirstAndLastWord(name)}
                            size="38"
                            round
                        />
                        <div className="leading-[1.2] ml-2">
                            <div className="text-sm font-medium text-gray-900">
                                {name}
                            </div>
                            <div className="text-xs text-gray-500">
                                {managers.length === 0
                                    ? "Chưa có trưởng nhóm"
                                    : managers[0].fullName}
                            </div>
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {child?.childs && child?.childs?.length != 0 && (
                        <ContextMenuItem
                            onClick={() => {
                                setParentId(child.id);
                                setOpenTeamCreate(true);
                            }}
                        >
                            <MdAdd />
                            Tạo team con
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem
                        onClick={() => {
                            setOpenTeamUpdate(true);
                        }}
                    >
                        <BiSolidPencil />
                        Chỉnh sửa team
                    </ContextMenuItem>
                    {/* <ContextMenuItem
                        onClick={() => {
                            setParentId(child.id);
                            setOpenTeamRouteConfig(true);
                        }}
                    >
                        <MdRoute />
                        Cấu hình định tuyến
                    </ContextMenuItem> */}
                    <ContextMenuItem
                        onClick={() => {
                            Swal.fire({
                                title: `Bạn muốn xóa đội sale ${name}?`,
                                text: "Bạn sẽ không thể hoàn lại thao tác này",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#d33",
                                cancelButtonText: "Hủy",
                                confirmButtonText: "Đồng ý",
                                preConfirm: async () => {
                                    try {
                                        const response = await deleteTeam(
                                            orgId,
                                            workspaceId,
                                            child.id,
                                        );
                                        return response;
                                    } catch (e) {
                                        toast.error(e);
                                    }
                                },
                            }).then((result) => {
                                const response = result.value;
                                if (response.message)
                                    return toast.error(response.message, {
                                        position: "top-center",
                                    });
                                if (teamId == child.id) {
                                    router.replace(
                                        pathname.replace(
                                            searchParams.get("teamId"),
                                            "",
                                        ),
                                    );
                                }
                                setRefreshList();
                                if (result.isConfirmed) {
                                    Swal.fire({
                                        title: "Thành công!",
                                        text: "Khách hàng đã bị xóa khỏi hệ thống",
                                        icon: "success",
                                    });
                                }
                            });
                        }}
                    >
                        <MdDelete />
                        Xóa team
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            <div
                className={cn(
                    ` transition-[grid-template-rows] duration-500 grid grid-rows-[0fr]`,
                    isExpanded && "grid-rows-[1fr]",
                )}
            >
                <div className="overflow-hidden">
                    <ExpansionTileList
                        childs={childs}
                        onTap={onTap}
                        style={{ marginLeft: `${index * 18}px` }}
                        index={index}
                    />
                </div>
            </div>
        </div>
    );
};
