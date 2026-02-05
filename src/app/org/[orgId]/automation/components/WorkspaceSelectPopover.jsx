"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function WorkspaceSelectPopover({ children, workspaceList, selectedId, setSelectedId }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="pl-6 min-w-[250px]">
        <RadioGroup
          value={selectedId}
          onValueChange={(value) => {
            setSelectedId(value);
            setOpen(false);
          }}
        >
          {workspaceList?.map((workspace) => (
            <div key={workspace.id} className="flex items-center space-x-2 py-1">
              <RadioGroupItem value={workspace.id} id={workspace.id} />
              <label
                htmlFor={workspace.id}
                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {workspace.name}
              </label>
            </div>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
} 