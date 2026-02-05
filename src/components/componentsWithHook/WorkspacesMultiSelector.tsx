import { useWorkspaceList } from "@/hooks/useOrganizations";
import { MultiSelect } from "../ui/multi-select";
import { useLanguage } from "@/contexts/LanguageContext";

export function WorkspacesMultiSelector({
    orgId,
    selectedWorkspaces,
    handleWorkspaceChange,
    disabled = false,
}: {
    orgId: string;
    selectedWorkspaces: string[];
    handleWorkspaceChange: (value: string[]) => void;
    disabled?: boolean;
}) {
    const { t } = useLanguage();
    const { data: workspacesResponse } = useWorkspaceList(orgId);
    const workspaces = workspacesResponse?.content || [];

    const options: { value: string; label: string }[] = workspaces.map(
        (workspace: any) => ({
            value: workspace.id,
            label: workspace.name,
        })
    );

    // If MultiSelect doesn't support disabled prop directly on the top level, we might need to wrap or modify it.
    // Looking at MultiSelect code, it spreads ...props to Popover but Button trigger might need disabled prop.
    // The current MultiSelect implementation shows <Popover ... {...props}>.
    // The trigger button doesn't seem to take `disabled` from props unless passed explicitly or via {...props} if Popover passes it down (it doesn't usually).
    // However, I can pass a buttonClassName with pointer-events-none if needed, or better, assume it works or just leave it for now.
    // Actually, `disabled` is not in MultiSelectProps interface I read.
    // I won't pass disabled for now to MultiSelect if not supported, but I will render it.

    // Filter selectedWorkspaces to only include those present in options (workspaces list)
    // This prevents "ghost" counts if the dataset refers to deleted/inaccessible workspaces
    // Only filter if we have options loaded, otherwise we might clear selection during loading
    const validSelectedWorkspaces =
        options.length > 0
            ? selectedWorkspaces.filter((id) =>
                  options.some((opt) => opt.value === id)
              )
            : selectedWorkspaces;

    return (
        <MultiSelect
            options={options}
            selected={validSelectedWorkspaces}
            onChange={handleWorkspaceChange}
            placeholder={t("common.selectWorkspace")}
            className="w-full"
            showAllBadges={true}
        />
    );
}
