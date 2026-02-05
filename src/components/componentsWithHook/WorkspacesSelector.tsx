import { useAllWorkspaces, useWorkspaceList } from "@/hooks/useOrganizations";
import { UserWorkspace } from "@/lib/interface";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

export function WorkspacesSelector({
    orgId,
    selectedWorkspace,
    handleWorkspaceChange,
    hasWorkspaceId,
}: {
    orgId: string;
    selectedWorkspace: string;
    handleWorkspaceChange: (value: string) => void;
    hasWorkspaceId?: boolean;
}) {
    const { t } = useLanguage();
    const { data: workspacesResponse } = useWorkspaceList(orgId);
    const workspaces = workspacesResponse?.content || [];
    return (
        <Select
            value={selectedWorkspace}
            onValueChange={handleWorkspaceChange}
            disabled={hasWorkspaceId}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={t("common.selectWorkspace")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">{t("common.noSelect")}</SelectItem>

                {workspaces.map((workspace: any) => (
                    <SelectItem
                        key={workspace.id}
                        value={workspace.id}
                    >
                        {workspace.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
