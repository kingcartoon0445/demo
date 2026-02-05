"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import Avatar from "react-avatar";
import { useState, useEffect } from "react";
import { getAvatarUrl } from "@/lib/utils";
import { useParams } from "next/navigation";
import { getAllMembers } from "@/api/org";
import { getTeams, getTeamMemberships } from "@/api/teamV2";
import { updateDistributionTargetV2 } from "@/api/automationV2";
import toast from "react-hot-toast";
import { ToastPromise } from "@/components/toast";

export default function AssignRatioConfigDialog({
    open,
    setOpen,
    onSave,
    assignTeam = null,
    rule = "ORGANIZATION",
    editMode = false,
    ruleData = null,
    initialDistributionTargets = [],
    selectedWorkspaceId = null,
}) {
    const params = useParams();
    const [activeTab, setActiveTab] = useState("members");
    const [members, setMembers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [showActiveOnly, setShowActiveOnly] = useState(editMode);

    // Reset state khi mở lại dialog hoặc assignTeam thay đổi
    useEffect(() => {
        if (open) {
            setMembers([]);
            setTeams([]);
            setShowActiveOnly(editMode);
            // Nếu chọn team cụ thể, chỉ load members và teams trong team đó
            if (rule === "ASSIGN_TO" && assignTeam) {
                loadTeamMemberships();
            } else {
                // Nếu chọn tổ chức, load tất cả
                loadMembers();
                loadTeams();
            }
        }
    }, [open, assignTeam?.id, rule]);

    // Helper function để map tỉ lệ từ initialDistributionTargets
    const mapRatioToItems = (items, isMember = true) => {
        // Nếu không phải edit mode, mặc định ratio = 1 (hoặc giữ nguyên logic cũ nếu cần)
        // User yêu cầu: "logic này chỉ hoạt động ở edit mode thôi nhé"
        if (!editMode) {
            return items.map((item) => ({ ...item, ratio: 0 }));
        }

        const targets = initialDistributionTargets || [];

        return items.map((item) => {
            const target = targets.find((t) => {
                if (isMember) {
                    // Nếu là member, tìm target khớp profileId
                    // (Đã loại bỏ điều kiện !t.teamId để hỗ trợ trường hợp member target có teamId)
                    return t.profileId === item.profileId;
                } else {
                    // Nếu là team, tìm target có teamId khớp và KHÔNG có profileId
                    return t.teamId === item.id && !t.profileId;
                }
            });

            return {
                ...item,
                ratio: target
                    ? target.setting !== undefined
                        ? target.setting
                        : target.weight
                    : 0,
            };
        });
    };

    const loadMembers = async () => {
        if (loadingMembers) return;
        setLoadingMembers(true);
        try {
            const query = selectedWorkspaceId
                ? {
                      workspaceId: selectedWorkspaceId,
                  }
                : {};
            const response = await getAllMembers(params.orgId, query);
            if (response?.code === 0 && response?.content) {
                // Map API response to standard structure
                const membersData = response.content.map((member) => ({
                    profileId: member.id || member.profileId || member.userId,
                    fullName: member.fullName || member.name,
                    avatar: member.avatar,
                }));
                const membersWithRatio = mapRatioToItems(membersData, true);
                setMembers(membersWithRatio);
            }
        } catch (error) {
            console.error("Error loading members:", error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const loadTeams = async () => {
        if (loadingTeams) return;
        setLoadingTeams(true);
        try {
            const response = await getTeams(params.orgId, {
                limit: 1000,
            });
            if (response?.code === 0 && response?.content) {
                const teamsWithRatio = mapRatioToItems(response.content, false);
                setTeams(teamsWithRatio);
            }
        } catch (error) {
            console.error("Error loading teams:", error);
        } finally {
            setLoadingTeams(false);
        }
    };

    // Load members và sub-teams từ team được chọn
    const loadTeamMemberships = async () => {
        if (!assignTeam?.id) return;
        setLoadingMembers(true);
        setLoadingTeams(true);
        try {
            const response = await getTeamMemberships(
                params.orgId,
                assignTeam.id,
                selectedWorkspaceId ? { workspaceId: selectedWorkspaceId } : {}
            );
            if (response?.code === 0 && response?.content) {
                // Lấy profiles (thành viên) từ response
                const profiles = response.content.profiles || [];
                const membersData = profiles.map((profile) => ({
                    profileId:
                        profile.id || profile.profileId || profile.userId,
                    fullName: profile.name,
                    avatar: profile.avatar,
                    teamId: assignTeam.id, // Gắn teamId của team cha
                }));
                const membersWithRatio = mapRatioToItems(membersData, true);
                setMembers(membersWithRatio);

                // Lấy sub-teams từ response
                const subTeams = response.content.teams || [];
                const teamsWithRatio = mapRatioToItems(subTeams, false);
                setTeams(teamsWithRatio);
            }
        } catch (error) {
            console.error("Error loading team memberships:", error);
        } finally {
            setLoadingMembers(false);
            setLoadingTeams(false);
        }
    };

    const handleMemberRatioChange = (profileId, newRatio) => {
        if (!profileId) return;
        setMembers((prev) =>
            prev.map((member) =>
                member.profileId === profileId
                    ? { ...member, ratio: Math.max(0, parseInt(newRatio) || 0) }
                    : member
            )
        );
    };

    const handleTeamRatioChange = (teamId, newRatio) => {
        if (!teamId) return;
        setTeams((prev) =>
            prev.map((team) =>
                team.id === teamId
                    ? { ...team, ratio: Math.max(0, parseInt(newRatio) || 0) }
                    : team
            )
        );
    };

    const handleSave = async () => {
        // Luôn trả về dữ liệu cho parent xử lý (cả create và edit mode)
        // Parent sẽ quyết định gọi API nào
        if (onSave) {
            onSave({
                members: members,
                teams: teams,
            });
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="sm:max-w-[600px] w-[90vw] max-h-[80vh] overflow-hidden flex flex-col"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="font-medium text-[20px] text-title flex items-center justify-between mt-6 mb-3">
                        <span>Cấu hình tỉ lệ phân phối</span>
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="show-active"
                                className="text-sm font-normal text-gray-600 cursor-pointer"
                            >
                                Chỉ hiện đang phân phối
                            </label>
                            <Switch
                                id="show-active"
                                checked={showActiveOnly}
                                onCheckedChange={setShowActiveOnly}
                            />
                        </div>
                    </DialogTitle>
                    <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full flex-1 flex flex-col overflow-hidden"
                >
                    <TabsList className="grid grid-cols-2 w-full mb-4">
                        <TabsTrigger value="members">Thành viên</TabsTrigger>
                        <TabsTrigger value="teams">Đội sale</TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="members"
                        className="flex-1 overflow-y-auto mt-0"
                    >
                        {loadingMembers ? (
                            <div className="text-center py-8 text-gray-500">
                                Đang tải...
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {members
                                    .filter((m) =>
                                        showActiveOnly ? m.ratio > 0 : true
                                    )
                                    .map((member) => (
                                        <div
                                            key={member.profileId}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={member.fullName}
                                                    src={getAvatarUrl(
                                                        member.avatar
                                                    )}
                                                    round
                                                    size="40"
                                                />
                                                <div className="text-title text-base font-medium">
                                                    {member.fullName}
                                                </div>
                                            </div>
                                            <CountComponent
                                                defaultNumber={member.ratio}
                                                onValueChange={(count) =>
                                                    handleMemberRatioChange(
                                                        member.profileId,
                                                        count
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="teams"
                        className="flex-1 overflow-y-auto mt-0"
                    >
                        {loadingTeams ? (
                            <div className="text-center py-8 text-gray-500">
                                Đang tải...
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {teams
                                    .filter((t) =>
                                        showActiveOnly ? t.ratio > 0 : true
                                    )
                                    .map((team) => (
                                        <div
                                            key={team.id}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={team.name}
                                                    round
                                                    size="40"
                                                />
                                                <div className="text-title text-base font-medium">
                                                    {team.name}
                                                </div>
                                            </div>
                                            <CountComponent
                                                defaultNumber={team.ratio}
                                                onValueChange={(count) =>
                                                    handleTeamRatioChange(
                                                        team.id,
                                                        count
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="sm:justify-end gap-2 mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-[35px] px-6"
                        onClick={() => setOpen(false)}
                    >
                        Huỷ
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        className="h-[35px] bg-primary text-white hover:bg-primary/90 px-6"
                        onClick={handleSave}
                    >
                        Lưu
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CountComponent({ defaultNumber, onValueChange }) {
    const [number, setNumber] = useState(
        defaultNumber !== undefined && defaultNumber !== null
            ? defaultNumber
            : 1
    );

    useEffect(() => {
        setNumber(
            defaultNumber !== undefined && defaultNumber !== null
                ? defaultNumber
                : 1
        );
    }, [defaultNumber]);

    const handleDecrease = () => {
        setNumber((prev) => {
            const newValue = Math.max(0, prev - 1);
            onValueChange(newValue);
            return newValue;
        });
    };

    const handleIncrease = () => {
        setNumber((prev) => {
            const newValue = prev + 1;
            onValueChange(newValue);
            return newValue;
        });
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        const numValue = value === "" ? 0 : Math.max(0, parseInt(value) || 0);
        setNumber(numValue);
        onValueChange(numValue);
    };

    return (
        <div className="ml-auto bg-bg2 flex items-center rounded-lg">
            <div
                onClick={handleDecrease}
                className="p-2 cursor-pointer hover:bg-gray-200 rounded-l-lg transition-colors"
            >
                -
            </div>
            <input
                type="number"
                min={0}
                value={number}
                className="bg-white w-12 rounded-lg outline-none border-none text-center py-[2px] text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onChange={handleInputChange}
            />
            <div
                onClick={handleIncrease}
                className="p-2 cursor-pointer hover:bg-gray-200 rounded-r-lg transition-colors"
            >
                +
            </div>
        </div>
    );
}
