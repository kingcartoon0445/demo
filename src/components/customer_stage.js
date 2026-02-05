import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useStageStore } from "@/store/stage";

export default function StageSelect({
  stage,
  setStage,
  isShowIcon = true,
  className,
}) {
  const params = useParams();
  const { stageGroups, loading, fetchStages, isStageHidden, isGroupHidden } = useStageStore();
  // Trạng thái local để quản lý stage đã được chọn
  const [selectedStage, setSelectedStage] = useState(stage);

  useEffect(() => {
    fetchStages(params.orgId, params.workspaceId);
  }, [params.orgId, params.workspaceId, fetchStages]);

  // Cập nhật selectedStage khi prop stage thay đổi
  useEffect(() => {
    if (stage) {
      setSelectedStage(stage);
    }
  }, [stage]);

  // Hàm xử lý khi chọn stage mới
  const handleStageChange = (newStage) => {
    setSelectedStage(newStage);
    setStage(newStage);
  };

  // Lọc các nhóm và trạng thái bị ẩn
  const filteredStageGroups = stageGroups.filter(group => !isGroupHidden(group.id));

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-title font-medium text-base animate-pulse">
        <div className="w-[28px] h-[28px] bg-gray-200 rounded-full" />
        <div className="h-6 w-32 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "outline-none border-none flex items-center gap-1 text-title font-medium text-base",
          className
        )}
      >
        {isShowIcon && (
          <Image
            alt="icon"
            src={"/icons/select_stage_icon.svg"}
            width={28}
            height={28}
            className="w-[28px] aspect-square object-contain"
          />
        )}
        {selectedStage ? selectedStage.name : "Chọn trạng thái"}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0">
        <DropdownMenuLabel className="px-4 py-2 text-base font-medium border-b">
          Trạng thái
        </DropdownMenuLabel>
        <Accordion type="single" collapsible className="w-[350px] py-3">
          {filteredStageGroups.map((group) => (
            <AccordionItem
              value={group.id}
              key={group.id}
              className="border-0 px-2"
            >
              <AccordionTrigger className="hover:no-underline py-3 px-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: group.hexCode }}
                  />
                  <span className="font-medium">{group.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <DropdownMenuRadioGroup
                  value={selectedStage?.id}
                  onValueChange={(stageId) => {
                    const newStage = group.stages.find(
                      (s) => s.id === stageId
                    );
                    if (newStage) {
                      handleStageChange(newStage);
                    }
                  }}
                >
                  {group.stages
                    .filter(stageItem => !isStageHidden(stageItem.id))
                    .map((stageItem) => (
                      <DropdownMenuRadioItem
                        value={stageItem.id}
                        key={stageItem.id}
                        className="px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: group.hexCode }}
                          />
                          <span>{stageItem.name}</span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
