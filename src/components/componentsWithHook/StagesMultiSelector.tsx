import { useGetCustomerTags } from "@/hooks/useCustomerV2";
import { MultiSelect } from "../ui/multi-select";
import { CustomerTag, DealStage } from "@/lib/interface";
import { Skeleton } from "../ui/skeleton";
import { useDealStages } from "@/hooks/useDeals";

interface StagesMultiSelectorProps {
    orgId: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    hideChevron?: boolean;
    hideBadges?: boolean;
}

export function StagesMultiSelector({
    orgId,
    value,
    onChange,
    placeholder,
    hideChevron,
    hideBadges,
}: StagesMultiSelectorProps) {
    const { data: dealStagesResponse, isLoading } = useDealStages(orgId);
    const dealStages = dealStagesResponse?.content || [];
    const options = (dealStages as DealStage[]).map((stage) => ({
        value: stage.id,
        label: stage.name,
    }));
    if (isLoading) {
        return <Skeleton className="h-10 w-full rounded-xl" />;
    }
    return (
        <MultiSelect
            options={options}
            selected={value}
            onChange={onChange}
            placeholder={placeholder}
            hideChevron={hideChevron}
            hideBadges={hideBadges}
            buttonClassName="overflow-hidden"
            textClassName="truncate"
        />
    );
}
