import { useOrgUtmSource } from "@/hooks/useOrgV2";
import { UtmSource } from "@/lib/interface";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "../ui/command";
import { useState, useEffect } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUtmSourceV2 } from "@/api/workspace";
import toast from "react-hot-toast";

interface UtmSourceSelectorProps {
    orgId: string;
    value: string;
    onChange: (value: string) => void;
}

export function UtmSourceSelector({
    orgId,
    value,
    onChange,
}: UtmSourceSelectorProps) {
    const { t } = useLanguage();
    const { data: utmSourcesResponse, isLoading } = useOrgUtmSource(orgId);
    const utmSources = utmSourcesResponse?.content || [];
    const uniqueUtmSources = Array.from(
        new Map(
            (utmSources as UtmSource[]).map((utmSource) => [
                utmSource.name,
                utmSource,
            ])
        ).values()
    );
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [selectedSourceName, setSelectedSourceName] = useState("");
    const queryClient = useQueryClient();

    const createUtmSourceMutation = useMutation({
        mutationFn: (name: string) => createUtmSourceV2(orgId, { name }),
        onSuccess: (res: any, variables) => {
            if (res.code === 0) {
                queryClient.invalidateQueries({
                    queryKey: ["org-utm-source", orgId],
                });
                onChange(variables);
                setSelectedSourceName(variables);
                setOpen(false);
                setSearch("");
                toast.success("Tạo UTM Source thành công");
            } else {
                toast.error(res.message || "Tạo thất bại");
            }
        },
        onError: () => {
            toast.error("Có lỗi xảy ra");
        },
    });

    // Find the name of the selected source when the value or sources change
    useEffect(() => {
        if (value && uniqueUtmSources.length > 0) {
            const selectedSource = (uniqueUtmSources as UtmSource[]).find(
                (source) => source.id === value
            );
            if (selectedSource) {
                setSelectedSourceName(selectedSource.name);
            }
        } else if (!value) {
            setSelectedSourceName("");
        }
    }, [value, uniqueUtmSources]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    onClick={() => setOpen(true)}
                >
                    <span className="truncate block max-w-[90%] text-left">
                        {selectedSourceName || t("common.selectUtmSource")}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={t("common.searchUtmSource")}
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {/* Option để bỏ chọn */}
                        <CommandItem
                            value="clear"
                            onSelect={() => {
                                onChange("");
                                setSelectedSourceName("");
                                setOpen(false);
                            }}
                        >
                            <span className="text-muted-foreground">
                                {t("common.noSelect")}
                            </span>
                        </CommandItem>
                        {uniqueUtmSources.filter((utmSource: UtmSource) =>
                            utmSource.name
                                .toLowerCase()
                                .includes(search.toLowerCase())
                        ).length === 0 &&
                            search.trim() && (
                                <CommandItem
                                    value="create_new"
                                    onSelect={() => {
                                        createUtmSourceMutation.mutate(
                                            search.trim()
                                        );
                                    }}
                                >
                                    <span className="text-primary">
                                        + Tạo mới "{search.trim()}"
                                    </span>
                                </CommandItem>
                            )}
                        {(uniqueUtmSources as UtmSource[])
                            .filter((utmSource: UtmSource) =>
                                utmSource.name
                                    .toLowerCase()
                                    .includes(search.toLowerCase())
                            )
                            .map((utmSource: UtmSource) => (
                                <CommandItem
                                    key={utmSource.id}
                                    value={utmSource.name}
                                    onSelect={() => {
                                        onChange(utmSource.name);
                                        setSelectedSourceName(utmSource.name);
                                        setOpen(false);
                                    }}
                                >
                                    {utmSource.name}
                                </CommandItem>
                            ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
