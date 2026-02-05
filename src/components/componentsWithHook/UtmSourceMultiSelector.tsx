import { useOrgUtmSource } from "@/hooks/useOrgV2";
import { MultiSelect } from "../ui/multi-select";
import { UtmSource } from "@/lib/interface";

interface UtmSourceMultiSelectorProps {
    orgId: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    hideChevron?: boolean;
    hideBadges?: boolean;
}

export function UtmSourceMultiSelector({
    orgId,
    value,
    onChange,
    placeholder = "Chọn nguồn...",
    hideChevron = false,
    hideBadges,
}: UtmSourceMultiSelectorProps) {
    const { data: utmSourceResponse, isLoading } = useOrgUtmSource(orgId);
    const utmSources = utmSourceResponse?.content || [];

    const uniqueUtmSources = Array.from(
        new Map(
            (utmSources as UtmSource[]).map((utmSource) => [
                utmSource.name,
                utmSource,
            ])
        ).values()
    );
    const options = (uniqueUtmSources as UtmSource[]).map((utmSource) => ({
        value: utmSource.name,
        label: utmSource.name,
        useNameAsValue: true,
    }));
    return (
        <MultiSelect
            options={options}
            selected={value}
            onChange={onChange}
            placeholder={placeholder}
            hideChevron={hideChevron}
            hideBadges={hideBadges}
        />
    );
}
