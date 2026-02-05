import { assignToCustomer, assignToCustomerV2 } from "@/api/customer";
import { getAllWorkspaces, getOrgMembers } from "@/api/org";
import { getUserCurrentManagerList } from "@/api/team";
import { getTeamListV2 } from "@/api/teamV2";
import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomerList, useCustomerParams } from "@/hooks/customers_data";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "react-avatar";
import toast from "react-hot-toast";
import { FiCheck } from "react-icons/fi";
import { IoMdSearch } from "react-icons/io";
import { MdOutlineGroup } from "react-icons/md";
import { useDebounce } from "use-debounce";

function CustomTabButton({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                active
                    ? "bg-primary text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
        >
            {children}
        </button>
    );
}

// Module-level recursive team tree item to keep component identity stable across renders
function TeamTreeItem({
    team,
    level = 0,
    mode,
    isSelected,
    onToggle,
    onRequestAssign,
}) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = (team.childs || []).length > 0;
    const selected = isSelected(team);
    return (
        <div className="flex flex-col">
            <div
                className={`flex items-center gap-3 cursor-pointer w-full px-3 py-2 hover:bg-accent transition-all rounded-xl ${
                    selected ? "bg-blue-100 border border-blue-300" : ""
                }`}
                style={{ paddingLeft: 12 + level * 18 }}
                onClick={() => {
                    if (mode === "select") {
                        onToggle(team, selected);
                        return;
                    }
                    onRequestAssign(team);
                }}
            >
                <div className="w-[24px] flex items-center justify-center">
                    {hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                            className="text-2xl leading-none"
                        >
                            {expanded ? "▾" : "▸"}
                        </button>
                    )}
                </div>
                <Avatar
                    name={getFirstAndLastWord(team?.name)}
                    size="46"
                    round
                    className="object-cover"
                />
                <div className="flex flex-col flex-grow">
                    <div className="font-medium text-base">{team?.name}</div>
                    {team?.managers && team.managers.length > 0 && (
                        <div className="text-xs flex items-center gap-1">
                            {team.managers[0].fullName}
                        </div>
                    )}
                </div>
                {selected && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <FiCheck className="text-white" />
                    </div>
                )}
            </div>
            {hasChildren && expanded && (
                <div>
                    {(team.childs || []).map((child) => (
                        <TeamTreeItem
                            key={child.id}
                            team={child}
                            level={level + 1}
                            mode={mode}
                            isSelected={isSelected}
                            onToggle={onToggle}
                            onRequestAssign={onRequestAssign}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CustomerAssignListDialog({
    open,
    setOpen,
    customerID,
    defaultAssignees = [],
    mode = "assign", // "assign" | "select"
    onSelected, // callback when mode === "select"
    showWorkspaceTab = false,
    restrictTo, // "members" | "teams" | "workspaces" | undefined
    singleSelect = false, // true: chỉ chọn 1 thành viên, false: chọn nhiều thành viên
}) {
    const { orgId } = useParams();
    const { workspaceId } = useCustomerParams();
    const updateCustomerRef = useRef(false);
    const { setRefreshList, setRefresh } = useCustomerList();

    // State
    const [searchMember, setSearchMember] = useState("");
    const [searchTeam, setSearchTeam] = useState("");
    const [memberList, setMemberList] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [teamList, setTeamList] = useState([]);
    const [filteredTeamList, setFilteredTeamList] = useState([]);
    const [salesTeamMemberList, setSalesTeamMemberList] = useState([]);
    const [searchSalesMember, setSearchSalesMember] = useState("");
    const [workspaceList, setWorkspaceList] = useState([]);
    const [filteredWorkspaceList, setFilteredWorkspaceList] = useState([]);
    const [searchWorkspace, setSearchWorkspace] = useState("");
    const [openAlert, setOpenAlert] = useState(false);
    const [alertData, setAlertData] = useState(null);
    const [activeSubTab, setActiveSubTab] = useState("organization");
    const [isLoading, setIsLoading] = useState({
        members: false,
        teams: false,
        salesMembers: false,
        workspaces: false,
    });
    const [isAssigning, setIsAssigning] = useState(false);

    // Teams tree helpers (to avoid redefining components inside render causing flicker)
    const isTeamSelected = useCallback(
        (team) => {
            return selectedMembers.some((member) => {
                const memberId =
                    member.profileId ||
                    member.saleTeamId ||
                    member.teamId ||
                    member.id;
                return memberId === team.id;
            });
        },
        [selectedMembers]
    );

    const handleTeamClickSelectMode = useCallback(
        (team, isSelected) => {
            if (isSelected) {
                setSelectedMembers(
                    selectedMembers.filter((member) => {
                        const memberId =
                            member.profileId ||
                            member.saleTeamId ||
                            member.teamId ||
                            member.id;
                        return memberId !== team.id;
                    })
                );
            } else {
                if (singleSelect) {
                    setSelectedMembers([team]);
                } else {
                    setSelectedMembers([...selectedMembers, team]);
                }
            }
        },
        [selectedMembers, singleSelect]
    );

    // remove old inline TeamTreeItem usage - now using module-level TeamTreeItem

    // Debounced search terms
    const [debouncedSearchMember] = useDebounce(searchMember, 500);
    const [debouncedSearchTeam] = useDebounce(searchTeam, 200);
    const [debouncedSearchSalesMember] = useDebounce(searchSalesMember, 500);

    // Reset và khởi tạo state khi dialog mở
    useEffect(() => {
        if (open) {
            // Thiết lập tab mặc định theo restrictTo nếu có; nếu không, luôn về "organization"
            if (restrictTo === "members") {
                setActiveSubTab("organization");
            } else if (restrictTo === "teams") {
                setActiveSubTab("teams");
            } else if (restrictTo === "workspaces") {
                setActiveSubTab("workspaces");
            } else {
                setActiveSubTab("organization");
            }

            // Chỉ tải dữ liệu khi dialog mở
            if (memberList.length === 0 && activeSubTab === "organization") {
                fetchOrgMembers();
            }

            if (teamList.length === 0) {
                fetchTeamList();
            }

            if (
                salesTeamMemberList.length === 0 &&
                activeSubTab === "salesTeam"
            ) {
                fetchSalesTeamMembers();
            }

            if (
                showWorkspaceTab &&
                workspaceList.length === 0 &&
                activeSubTab === "workspaces"
            ) {
                fetchWorkspaces();
            }
        } else {
            // Reset selectedMembers khi đóng dialog
            setSelectedMembers([]);
        }
    }, [open]);

    // Separate effect for defaultAssignees to avoid infinite loop
    useEffect(() => {
        if (open && defaultAssignees) {
            setSelectedMembers(defaultAssignees);
        }
    }, [open]);

    // Khi chuyển tab, load dữ liệu tương ứng nếu cần
    useEffect(() => {
        if (open) {
            if (activeSubTab === "organization" && memberList.length === 0) {
                fetchOrgMembers();
            } else if (
                activeSubTab === "salesTeam" &&
                salesTeamMemberList.length === 0
            ) {
                fetchSalesTeamMembers();
            } else if (
                showWorkspaceTab &&
                activeSubTab === "workspaces" &&
                workspaceList.length === 0
            ) {
                fetchWorkspaces();
            }
            // Ensure data refresh when reopening without search terms
            if (activeSubTab === "organization" && !debouncedSearchMember) {
                fetchOrgMembers("");
            }
            if (activeSubTab === "teams" && !debouncedSearchTeam) {
                fetchTeamList();
            }
            if (
                showWorkspaceTab &&
                activeSubTab === "workspaces" &&
                !searchWorkspace
            ) {
                fetchWorkspaces();
            }
        }
    }, [activeSubTab, open]);

    // Tìm kiếm thành viên
    useEffect(() => {
        if (open && debouncedSearchMember && activeSubTab === "organization") {
            fetchOrgMembers(debouncedSearchMember);
        }
    }, [debouncedSearchMember, open]);

    // Tìm kiếm đội sale
    useEffect(() => {
        if (
            open &&
            debouncedSearchSalesMember &&
            activeSubTab === "salesTeam"
        ) {
            fetchSalesTeamMembers(debouncedSearchSalesMember);
        }
    }, [debouncedSearchSalesMember, open]);

    // Lọc team theo từ khóa
    useEffect(() => {
        if (teamList.length > 0) {
            filterTeams(debouncedSearchTeam);
        }
    }, [debouncedSearchTeam, teamList]);

    // Lọc workspace theo từ khóa
    useEffect(() => {
        if (workspaceList.length > 0) {
            filterWorkspaces(searchWorkspace);
        }
    }, [searchWorkspace, workspaceList]);

    // Tách các hàm gọi API thành các hàm riêng biệt
    const fetchOrgMembers = useCallback(
        async (searchTerm = "") => {
            if (!orgId) return;

            try {
                setIsLoading((prev) => ({ ...prev, members: true }));
                const res = await getOrgMembers(
                    orgId,
                    0,
                    searchTerm,
                    undefined,
                    workspaceId
                );

                if (res?.code !== 0) {
                    toast.error(
                        res?.message || "Không thể lấy danh sách thành viên"
                    );
                    return;
                }

                setMemberList(res?.content || []);
            } catch (error) {
                console.error("Error fetching members:", error);
                toast.error("Không thể lấy danh sách thành viên");
            } finally {
                setIsLoading((prev) => ({ ...prev, members: false }));
            }
        },
        [orgId]
    );

    const fetchTeamList = useCallback(async () => {
        if (!orgId) return;

        try {
            setIsLoading((prev) => ({ ...prev, teams: true }));
            const res = await getTeamListV2(orgId, workspaceId, {
                offset: 0,
                limit: 1000,
                search: debouncedSearchTeam,
            });

            if (res?.code !== 0) {
                toast.error(res?.message || "Không thể lấy danh sách đội");
                return;
            }

            const teams = res?.content || [];
            setTeamList(teams);
            setFilteredTeamList(teams);
        } catch (error) {
            console.error("Error fetching teams:", error);
            toast.error("Không thể lấy danh sách đội");
        } finally {
            setIsLoading((prev) => ({ ...prev, teams: false }));
        }
    }, [orgId, workspaceId]);

    const fetchSalesTeamMembers = useCallback(
        async (searchTerm = "") => {
            if (!orgId || !workspaceId) return;

            try {
                setIsLoading((prev) => ({ ...prev, salesMembers: true }));
                const res = await getUserCurrentManagerList(
                    orgId,
                    workspaceId,
                    searchTerm,
                    false
                );

                if (res?.code !== 0) {
                    toast.error(
                        res?.message || "Không thể lấy danh sách quản lý"
                    );
                    return;
                }

                setSalesTeamMemberList(res?.content || []);
            } catch (error) {
                console.error("Error fetching sales team members:", error);
                toast.error("Không thể lấy danh sách quản lý");
            } finally {
                setIsLoading((prev) => ({ ...prev, salesMembers: false }));
            }
        },
        [orgId, workspaceId]
    );

    const filterTeams = useCallback(
        (searchTerm) => {
            if (!searchTerm) {
                setFilteredTeamList(teamList);
                return;
            }

            const filtered = teamList.filter((team) =>
                team.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            setFilteredTeamList(filtered);
        },
        [teamList]
    );

    const fetchWorkspaces = useCallback(async () => {
        console.log(orgId);
        if (!orgId) return;

        try {
            setIsLoading((prev) => ({ ...prev, workspaces: true }));
            const res = await getAllWorkspaces(orgId);
            const workspaces = res?.content || res || [];
            // Map the workspace data to use consistent property names
            const mappedWorkspaces = workspaces.map((ws) => ({
                id: ws.workspaceId,
                name: ws.workspaceName,
                workspaceId: ws.workspaceId,
                workspaceName: ws.workspaceName,
            }));
            setWorkspaceList(mappedWorkspaces);
            setFilteredWorkspaceList(mappedWorkspaces);
        } catch (error) {
            console.error("Error fetching workspaces:", error);
            toast.error("Không thể lấy danh sách không gian làm việc");
        } finally {
            setIsLoading((prev) => ({ ...prev, workspaces: false }));
        }
    }, [orgId]);

    const filterWorkspaces = useCallback(
        (searchTerm) => {
            if (!searchTerm) {
                setFilteredWorkspaceList(workspaceList);
                return;
            }

            const filtered = workspaceList.filter((ws) =>
                (ws.name || ws.workspaceName || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
            setFilteredWorkspaceList(filtered);
        },
        [workspaceList]
    );

    const handleAssignToMembers = useCallback(async () => {
        if (selectedMembers.length === 0 || isAssigning) return;

        setIsAssigning(true);
        try {
            const profileIds = selectedMembers.map(
                (member) => member.profileId
            );
            const response = await assignToCustomerV2(
                orgId,
                workspaceId,
                customerID,
                JSON.stringify({ profileIds: profileIds })
            );

            if (response.message) {
                toast.error(response.message, { position: "top-center" });
                return;
            }

            // Sử dụng setRefreshList để trigger refresh toàn bộ danh sách và setRefresh để cập nhật customer detail
            if (!updateCustomerRef.current) {
                updateCustomerRef.current = true;
                setRefreshList(); // Refresh danh sách khách hàng
                setRefresh(); // Refresh chi tiết khách hàng hiện tại
            }

            setOpenAlert(false);
            setOpen(false);

            toast.success(
                `Khách hàng này đã được phân phối thành công cho ${selectedMembers.length} thành viên`,
                { position: "top-center" }
            );
        } catch (error) {
            console.error("Error assigning to members:", error);
            toast.error("Không thể phân phối khách hàng", {
                position: "top-center",
            });
        } finally {
            setIsAssigning(false);
        }
    }, [
        selectedMembers,
        orgId,
        workspaceId,
        customerID,
        setOpen,
        setRefreshList,
        setRefresh,
        isAssigning,
    ]);

    const handleAssignToSalesMember = useCallback(
        async (member) => {
            if (isAssigning) return;
            setIsAssigning(true);
            try {
                const response = await assignToCustomer(
                    orgId,
                    workspaceId,
                    customerID,
                    JSON.stringify({
                        assignTo: member?.profileId,
                        teamId: member?.teamId,
                    })
                );

                if (response.message) {
                    toast.error(response.message, { position: "top-center" });
                    return;
                }

                // Sử dụng setRefreshList để trigger refresh toàn bộ danh sách và setRefresh để cập nhật customer detail
                if (!updateCustomerRef.current) {
                    updateCustomerRef.current = true;
                    setRefreshList(); // Refresh danh sách khách hàng
                    setRefresh(); // Refresh chi tiết khách hàng hiện tại
                }

                setOpenAlert(false);
                setOpen(false);

                toast.success(
                    `Khách hàng này đã được phân phối thành công cho ${member.fullName}`,
                    { position: "top-center" }
                );
            } catch (error) {
                console.error("Error assigning to sales member:", error);
                toast.error("Không thể phân phối khách hàng", {
                    position: "top-center",
                });
            } finally {
                setIsAssigning(false);
            }
        },
        [orgId, workspaceId, customerID, setOpen, setRefreshList, setRefresh]
    );

    const handleAssignToTeam = useCallback(
        async (team) => {
            if (isAssigning) return;
            setIsAssigning(true);
            try {
                const response = await assignToCustomer(
                    orgId,
                    workspaceId,
                    customerID,
                    JSON.stringify({ teamId: team?.id })
                );

                if (response.message) {
                    toast.error(response.message, { position: "top-center" });
                    return;
                }

                // Sử dụng setRefreshList để trigger refresh toàn bộ danh sách và setRefresh để cập nhật customer detail
                if (!updateCustomerRef.current) {
                    updateCustomerRef.current = true;
                    setRefreshList(); // Refresh danh sách khách hàng
                    setRefresh(); // Refresh chi tiết khách hàng hiện tại
                }

                setOpenAlert(false);
                setOpen(false);

                toast.success(
                    `Khách hàng này đã được phân phối thành công cho đội sale ${team.name}`,
                    { position: "top-center" }
                );
            } catch (error) {
                console.error("Error assigning to team:", error);
                toast.error("Không thể phân phối khách hàng", {
                    position: "top-center",
                });
            } finally {
                setIsAssigning(false);
            }
        },
        [
            orgId,
            workspaceId,
            customerID,
            setOpen,
            setRefreshList,
            setRefresh,
            isAssigning,
        ]
    );

    // Reset updateCustomerRef khi component unmount
    useEffect(() => {
        return () => {
            updateCustomerRef.current = false;
        };
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-2xl pb-0">
                <DialogHeader>
                    <DialogTitle className="pb-5">Chuyển phụ trách</DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>
                <div className="flex flex-col items-center">
                    {/* End helper area */}
                    {openAlert && (
                        <CustomerAlertDialog
                            open={openAlert}
                            setOpen={setOpenAlert}
                            title={alertData?.title}
                            subtitle={alertData?.subtitle}
                            onSubmit={alertData?.onSubmit}
                            confirmText="Xác nhận"
                            isSubmitting={isAssigning}
                        />
                    )}
                    <Tabs
                        defaultValue={
                            restrictTo === "teams"
                                ? "teams"
                                : restrictTo === "workspaces"
                                ? "workspaces"
                                : "members"
                        }
                        className="w-full"
                        onValueChange={(value) => {
                            if (value === "members") {
                                setActiveSubTab("organization");
                            } else if (value === "teams") {
                                setActiveSubTab("teams");
                            } else if (value === "workspaces") {
                                setActiveSubTab("workspaces");
                            }
                        }}
                    >
                        <TabsList
                            className={`grid w-full ${
                                restrictTo
                                    ? "grid-cols-1"
                                    : showWorkspaceTab
                                    ? "grid-cols-3"
                                    : "grid-cols-2"
                            }`}
                        >
                            {(!restrictTo || restrictTo === "members") && (
                                <TabsTrigger value="members">
                                    Thành viên
                                </TabsTrigger>
                            )}
                            {(!restrictTo || restrictTo === "teams") && (
                                <TabsTrigger value="teams">
                                    Đội Sale
                                </TabsTrigger>
                            )}
                            {showWorkspaceTab &&
                                (!restrictTo ||
                                    restrictTo === "workspaces") && (
                                    <TabsTrigger value="workspaces">
                                        Không gian
                                    </TabsTrigger>
                                )}
                        </TabsList>
                        <TabsContent value="members">
                            <div className="w-full mt-4">
                                <div className="flex items-center mb-4">
                                    {activeSubTab === "organization" ? (
                                        <div className="relative w-full">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 transform">
                                                <IoMdSearch className="text-2xl" />
                                            </div>
                                            <Input
                                                value={searchMember}
                                                onChange={(e) =>
                                                    setSearchMember(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Tìm kiếm thành viên"
                                                className="bg-bg1 border-none h-[40px] pl-12 rounded-xl text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative w-full">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 transform">
                                                <IoMdSearch className="text-2xl" />
                                            </div>
                                            <Input
                                                value={searchSalesMember}
                                                onChange={(e) =>
                                                    setSearchSalesMember(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Tìm kiếm thành viên đội sale"
                                                className="bg-bg1 border-none h-[40px] pl-12 rounded-xl text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                                {activeSubTab === "organization" && (
                                    <div>
                                        <ScrollArea className="flex flex-col mt-4 h-[460px] pr-4">
                                            {isLoading.members ? (
                                                <div className="flex justify-center items-center h-40">
                                                    Đang tải danh sách thành
                                                    viên...
                                                </div>
                                            ) : memberList.length === 0 ? (
                                                <div className="flex justify-center items-center h-40">
                                                    Không tìm thấy thành viên
                                                </div>
                                            ) : (
                                                memberList.map((e, i) => {
                                                    const isSelected =
                                                        selectedMembers.some(
                                                            (member) => {
                                                                // Hỗ trợ cả Assignee và AssignedTo
                                                                const memberId =
                                                                    member.profileId ||
                                                                    member.saleTeamId ||
                                                                    member.id;
                                                                return (
                                                                    memberId ===
                                                                    e.profileId
                                                                );
                                                            }
                                                        );
                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => {
                                                                if (
                                                                    isSelected
                                                                ) {
                                                                    setSelectedMembers(
                                                                        selectedMembers.filter(
                                                                            (
                                                                                member
                                                                            ) =>
                                                                                member.profileId !==
                                                                                e.profileId
                                                                        )
                                                                    );
                                                                } else {
                                                                    if (
                                                                        singleSelect
                                                                    ) {
                                                                        // Chế độ chọn 1: chỉ chọn thành viên này (không auto-close/callback)
                                                                        setSelectedMembers(
                                                                            [e]
                                                                        );
                                                                    } else {
                                                                        // Chế độ chọn nhiều: thêm vào danh sách
                                                                        setSelectedMembers(
                                                                            [
                                                                                ...selectedMembers,
                                                                                e,
                                                                            ]
                                                                        );
                                                                    }
                                                                }
                                                            }}
                                                            className={`flex items-center gap-3 cursor-pointer w-full px-4 py-1 hover:bg-accent transition-all rounded-xl mb-1.5 ${
                                                                isSelected
                                                                    ? "bg-blue-100 border border-blue-300"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <Avatar
                                                                name={getFirstAndLastWord(
                                                                    e?.fullName
                                                                )}
                                                                src={getAvatarUrl(
                                                                    e?.avatar
                                                                )}
                                                                size="46"
                                                                round
                                                                className="object-cover"
                                                            />
                                                            <div className="flex flex-col flex-grow">
                                                                <div className="font-medium text-base">
                                                                    {
                                                                        e?.fullName
                                                                    }
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                                    <FiCheck className="text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </ScrollArea>
                                        <div className="flex justify-between items-center py-3 border-t mt-2">
                                            <div className="text-sm">
                                                {selectedMembers.length > 0 &&
                                                    (singleSelect
                                                        ? `Đã chọn thành viên`
                                                        : `Đã chọn ${selectedMembers.length} thành viên`)}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedMembers(
                                                            defaultAssignees ||
                                                                []
                                                        );
                                                        setOpen(false);
                                                    }}
                                                >
                                                    Hủy
                                                </Button>
                                                <Button
                                                    disabled={
                                                        mode !== "select" &&
                                                        selectedMembers.length ===
                                                            0
                                                    }
                                                    onClick={() => {
                                                        if (mode === "select") {
                                                            if (
                                                                selectedMembers.length ===
                                                                0
                                                            ) {
                                                                onSelected &&
                                                                    onSelected({
                                                                        type: "members",
                                                                        members:
                                                                            [],
                                                                        teams: [],
                                                                    });
                                                                setOpen(false);
                                                                return;
                                                            }
                                                            if (singleSelect) {
                                                                const onlyMember =
                                                                    selectedMembers[0];
                                                                const onlyTeams =
                                                                    [];
                                                                onSelected &&
                                                                    onSelected({
                                                                        type:
                                                                            onlyMember &&
                                                                            onlyTeams.length
                                                                                ? "combined"
                                                                                : "member",
                                                                        member: onlyMember,
                                                                        members:
                                                                            [
                                                                                onlyMember,
                                                                            ],
                                                                        teams: [],
                                                                    });
                                                            } else {
                                                                // Phân loại selections thành members và teams
                                                                const mems =
                                                                    selectedMembers.filter(
                                                                        (x) =>
                                                                            x?.profileId
                                                                    );
                                                                const tms =
                                                                    selectedMembers.filter(
                                                                        (x) =>
                                                                            x &&
                                                                            (x?.id ||
                                                                                x?.teamId ||
                                                                                x?.saleTeamId) &&
                                                                            !x?.profileId
                                                                    );
                                                                onSelected &&
                                                                    onSelected({
                                                                        type:
                                                                            mems.length >
                                                                                0 &&
                                                                            tms.length >
                                                                                0
                                                                                ? "combined"
                                                                                : mems.length >
                                                                                  0
                                                                                ? "members"
                                                                                : "teams",
                                                                        members:
                                                                            mems,
                                                                        teams: tms,
                                                                    });
                                                            }
                                                            setOpen(false);
                                                            return;
                                                        }
                                                        setAlertData({
                                                            title: "Chuyển phụ trách?",
                                                            subtitle:
                                                                selectedMembers.length ===
                                                                1
                                                                    ? "Bạn có chắc muốn phân phối data đến người này?"
                                                                    : `Bạn có chắc muốn phân phối data đến ${selectedMembers.length} người này?`,
                                                            onSubmit:
                                                                handleAssignToMembers,
                                                        });
                                                        setOpenAlert(true);
                                                    }}
                                                    type="button"
                                                >
                                                    Xác nhận
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSubTab === "salesTeam" && (
                                    <div>
                                        <ScrollArea className="flex flex-col mt-4 h-[500px]">
                                            {isLoading.salesMembers ? (
                                                <div className="flex justify-center items-center h-40">
                                                    Đang tải danh sách thành
                                                    viên đội sale...
                                                </div>
                                            ) : salesTeamMemberList.length ===
                                              0 ? (
                                                <div className="flex justify-center items-center h-40">
                                                    Không tìm thấy thành viên
                                                    đội sale
                                                </div>
                                            ) : (
                                                salesTeamMemberList.map(
                                                    (e, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => {
                                                                if (
                                                                    mode ===
                                                                    "select"
                                                                ) {
                                                                    onSelected &&
                                                                        onSelected(
                                                                            {
                                                                                type: "member",
                                                                                member: e,
                                                                            }
                                                                        );
                                                                    setOpen(
                                                                        false
                                                                    );
                                                                    return;
                                                                }
                                                                setAlertData({
                                                                    title: "Chuyển phụ trách?",
                                                                    subtitle:
                                                                        "Bạn có chắc muốn phân phối data đến người này?",
                                                                    onSubmit:
                                                                        () =>
                                                                            handleAssignToSalesMember(
                                                                                e
                                                                            ),
                                                                });
                                                                setOpenAlert(
                                                                    true
                                                                );
                                                            }}
                                                            className="flex items-center gap-3 cursor-pointer w-full px-3 py-2 hover:bg-accent transition-all rounded-xl"
                                                        >
                                                            <Avatar
                                                                name={getFirstAndLastWord(
                                                                    e?.fullName
                                                                )}
                                                                src={getAvatarUrl(
                                                                    e?.avatar
                                                                )}
                                                                size="46"
                                                                round
                                                                className="object-cover"
                                                            />
                                                            <div className="flex flex-col">
                                                                <div className="font-medium text-base">
                                                                    {
                                                                        e?.fullName
                                                                    }
                                                                </div>
                                                                <div className="text-xs flex items-center gap-1">
                                                                    <MdOutlineGroup />
                                                                    {
                                                                        e?.teamName
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="teams">
                            <div
                                className={`relative flex items-center w-full`}
                            >
                                <div className="h-auto absolute left-4 top-1/2 -translate-y-1/2 transform ">
                                    <IoMdSearch className="text-2xl" />
                                </div>
                                <Input
                                    value={searchTeam}
                                    onChange={(e) =>
                                        setSearchTeam(e.target.value)
                                    }
                                    aria-describedby="search-teams"
                                    placeholder="Nhập tên đội sale"
                                    type="search"
                                    className={`bg-bg1 border-none h-[40px] pl-12 rounded-xl`}
                                />
                            </div>
                            <ScrollArea className="flex flex-col mt-4 h-[500px]">
                                {isLoading.teams ? (
                                    <div className="flex justify-center items-center h-40">
                                        Đang tải danh sách đội sale...
                                    </div>
                                ) : (searchTeam || "").trim().length > 0 ? (
                                    filteredTeamList.length === 0 ? (
                                        <div className="flex justify-center items-center h-40">
                                            Không tìm thấy đội sale
                                        </div>
                                    ) : (
                                        filteredTeamList.map((e, i) => {
                                            const isSelected =
                                                selectedMembers.some(
                                                    (member) => {
                                                        const memberId =
                                                            member.profileId ||
                                                            member.saleTeamId ||
                                                            member.teamId ||
                                                            member.id;
                                                        return (
                                                            memberId === e.id
                                                        );
                                                    }
                                                );
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        if (mode === "select") {
                                                            if (isSelected) {
                                                                setSelectedMembers(
                                                                    selectedMembers.filter(
                                                                        (
                                                                            member
                                                                        ) => {
                                                                            const memberId =
                                                                                member.profileId ||
                                                                                member.saleTeamId ||
                                                                                member.id;
                                                                            return (
                                                                                memberId !==
                                                                                e.id
                                                                            );
                                                                        }
                                                                    )
                                                                );
                                                            } else {
                                                                if (
                                                                    singleSelect
                                                                ) {
                                                                    setSelectedMembers(
                                                                        [e]
                                                                    );
                                                                } else {
                                                                    setSelectedMembers(
                                                                        [
                                                                            ...selectedMembers,
                                                                            e,
                                                                        ]
                                                                    );
                                                                }
                                                            }
                                                            // Do not auto-close or callback; wait for Confirm button
                                                            return;
                                                        }
                                                        setAlertData({
                                                            title: "Chuyển phụ trách?",
                                                            subtitle:
                                                                "Bạn có chắc muốn phân phối data đến đội sale này?",
                                                            onSubmit: () =>
                                                                handleAssignToTeam(
                                                                    e
                                                                ),
                                                        });
                                                        setOpenAlert(true);
                                                    }}
                                                    className={`flex items-center gap-3 cursor-pointer w-full px-3 py-2 hover:bg-accent transition-all rounded-xl ${
                                                        isSelected
                                                            ? "bg-blue-100 border border-blue-300"
                                                            : ""
                                                    }`}
                                                >
                                                    <Avatar
                                                        name={getFirstAndLastWord(
                                                            e?.name
                                                        )}
                                                        size="46"
                                                        round
                                                        className="object-cover"
                                                    />
                                                    <div className="flex flex-col flex-grow">
                                                        <div className="font-medium text-base">
                                                            {e?.name}
                                                        </div>
                                                        <div className="text-xs flex items-center gap-1">
                                                            {e?.managers
                                                                ?.length != 0 &&
                                                                e?.managers[0]
                                                                    .fullName}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                            <FiCheck className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )
                                ) : teamList.length === 0 ? (
                                    <div className="flex justify-center items-center h-40">
                                        Không tìm thấy đội sale
                                    </div>
                                ) : (
                                    // Hierarchical view when no search term
                                    <div className="flex flex-col mt-1">
                                        {teamList.map((root) => (
                                            <TeamTreeItem
                                                key={root.id}
                                                team={root}
                                                level={0}
                                                mode={mode}
                                                isSelected={isTeamSelected}
                                                onToggle={
                                                    handleTeamClickSelectMode
                                                }
                                                onRequestAssign={(team) => {
                                                    setAlertData({
                                                        title: "Chuyển phụ trách?",
                                                        subtitle:
                                                            "Bạn có chắc muốn phân phối data đến đội sale này?",
                                                        onSubmit: () =>
                                                            handleAssignToTeam(
                                                                team
                                                            ),
                                                    });
                                                    setOpenAlert(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                            <div className="flex justify-between items-center py-3 border-t mt-2">
                                <div className="text-sm">
                                    {selectedMembers.length > 0 &&
                                        (singleSelect
                                            ? `Đã chọn đội sale`
                                            : `Đã chọn ${selectedMembers.length} đội sale`)}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedMembers(
                                                defaultAssignees || []
                                            );
                                            setOpen(false);
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={
                                            mode !== "select" &&
                                            selectedMembers.length === 0
                                        }
                                        onClick={() => {
                                            if (mode === "select") {
                                                if (
                                                    selectedMembers.length === 0
                                                ) {
                                                    onSelected &&
                                                        onSelected({
                                                            type: "teams",
                                                            members: [],
                                                            teams: [],
                                                        });
                                                    setOpen(false);
                                                    return;
                                                }
                                                if (singleSelect) {
                                                    const onlyTeam =
                                                        selectedMembers[0];
                                                    const onlyMembers = [];
                                                    onSelected &&
                                                        onSelected({
                                                            type:
                                                                onlyMembers.length &&
                                                                onlyTeam
                                                                    ? "combined"
                                                                    : "team",
                                                            team: onlyTeam,
                                                            members:
                                                                onlyMembers,
                                                            teams: [onlyTeam],
                                                        });
                                                } else {
                                                    // Phân loại selections thành members và teams
                                                    const mems =
                                                        selectedMembers.filter(
                                                            (x) => x?.profileId
                                                        );
                                                    const tms =
                                                        selectedMembers.filter(
                                                            (x) =>
                                                                x &&
                                                                (x?.id ||
                                                                    x?.teamId ||
                                                                    x?.saleTeamId) &&
                                                                !x?.profileId
                                                        );
                                                    onSelected &&
                                                        onSelected({
                                                            type:
                                                                mems.length >
                                                                    0 &&
                                                                tms.length > 0
                                                                    ? "combined"
                                                                    : tms.length >
                                                                      0
                                                                    ? "teams"
                                                                    : "members",
                                                            members: mems,
                                                            teams: tms,
                                                        });
                                                }
                                                setOpen(false);
                                                return;
                                            }
                                        }}
                                    >
                                        Xác nhận
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                        {showWorkspaceTab && (
                            <TabsContent value="workspaces">
                                <div className="w-full mt-4">
                                    <div className="relative w-full">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 transform ">
                                            <IoMdSearch className="text-2xl" />
                                        </div>
                                        <Input
                                            value={searchWorkspace}
                                            onChange={(e) =>
                                                setSearchWorkspace(
                                                    e.target.value
                                                )
                                            }
                                            aria-describedby="search-workspaces"
                                            placeholder="Nhập tên không gian làm việc"
                                            type="search"
                                            className={`bg-bg1 border-none h-[40px] pl-12 rounded-xl`}
                                        />
                                    </div>
                                    <ScrollArea className="flex flex-col mt-4 h-[500px]">
                                        {isLoading.workspaces ? (
                                            <div className="flex justify-center items-center h-40">
                                                Đang tải danh sách không gian
                                                làm việc...
                                            </div>
                                        ) : filteredWorkspaceList.length ===
                                          0 ? (
                                            <div className="flex justify-center items-center h-40">
                                                Không tìm thấy không gian làm
                                                việc
                                            </div>
                                        ) : (
                                            filteredWorkspaceList.map(
                                                (e, i) => {
                                                    const isSelected =
                                                        selectedMembers.some(
                                                            (member) => {
                                                                // Hỗ trợ cả Assignee, AssignedTo và Workspace
                                                                const memberId =
                                                                    member.profileId ||
                                                                    member.saleTeamId ||
                                                                    member.id ||
                                                                    member.workspaceId;
                                                                return (
                                                                    memberId ===
                                                                    (e.id ||
                                                                        e.workspaceId)
                                                                );
                                                            }
                                                        );
                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => {
                                                                if (
                                                                    mode ===
                                                                    "select"
                                                                ) {
                                                                    if (
                                                                        isSelected
                                                                    ) {
                                                                        setSelectedMembers(
                                                                            selectedMembers.filter(
                                                                                (
                                                                                    member
                                                                                ) => {
                                                                                    const memberId =
                                                                                        member.profileId ||
                                                                                        member.saleTeamId ||
                                                                                        member.id ||
                                                                                        member.workspaceId;
                                                                                    return (
                                                                                        memberId !==
                                                                                        (e.id ||
                                                                                            e.workspaceId)
                                                                                    );
                                                                                }
                                                                            )
                                                                        );
                                                                    } else {
                                                                        if (
                                                                            singleSelect
                                                                        ) {
                                                                            setSelectedMembers(
                                                                                [
                                                                                    e,
                                                                                ]
                                                                            );
                                                                        } else {
                                                                            setSelectedMembers(
                                                                                [
                                                                                    ...selectedMembers,
                                                                                    e,
                                                                                ]
                                                                            );
                                                                        }
                                                                    }
                                                                    if (
                                                                        onSelected &&
                                                                        !isSelected
                                                                    ) {
                                                                        onSelected(
                                                                            {
                                                                                type: "workspace",
                                                                                workspace:
                                                                                    e,
                                                                            }
                                                                        );
                                                                    }
                                                                    return;
                                                                }
                                                            }}
                                                            className={`flex items-center gap-3 cursor-pointer w-full px-3 py-2 hover:bg-accent transition-all rounded-xl ${
                                                                isSelected
                                                                    ? "bg-blue-100 border border-blue-300"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <Avatar
                                                                name={getFirstAndLastWord(
                                                                    e?.name
                                                                )}
                                                                size="46"
                                                                round
                                                                className="object-cover"
                                                            />
                                                            <div className="flex flex-col flex-grow">
                                                                <div className="font-medium text-base">
                                                                    {e?.name}
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                                    <FiCheck className="text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            )
                                        )}
                                    </ScrollArea>
                                    <div className="flex justify-between items-center py-3 border-t mt-2">
                                        <div className="text-sm">
                                            {selectedMembers.length > 0 &&
                                                (singleSelect
                                                    ? `Đã chọn không gian làm việc`
                                                    : `Đã chọn ${selectedMembers.length} không gian làm việc`)}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedMembers(
                                                        defaultAssignees || []
                                                    );
                                                    setOpen(false);
                                                }}
                                            >
                                                Hủy
                                            </Button>
                                            <Button
                                                disabled={
                                                    mode !== "select" &&
                                                    selectedMembers.length === 0
                                                }
                                                onClick={() => {
                                                    if (mode === "select") {
                                                        if (
                                                            selectedMembers.length ===
                                                            0
                                                        ) {
                                                            onSelected &&
                                                                onSelected({
                                                                    type: "workspaces",
                                                                    workspaces:
                                                                        [],
                                                                });
                                                            setOpen(false);
                                                            return;
                                                        }
                                                        if (singleSelect) {
                                                            // Chế độ chọn 1: trả về workspace đầu tiên
                                                            onSelected &&
                                                                onSelected({
                                                                    type: "workspace",
                                                                    workspace:
                                                                        selectedMembers[0],
                                                                });
                                                        } else {
                                                            // Chế độ chọn nhiều: trả về danh sách
                                                            onSelected &&
                                                                onSelected({
                                                                    type: "workspaces",
                                                                    workspaces:
                                                                        selectedMembers,
                                                                });
                                                        }
                                                        setOpen(false);
                                                        return;
                                                    }
                                                }}
                                            >
                                                Xác nhận
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
                <DialogFooter className="sm:justify-end"></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
