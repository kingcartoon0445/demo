import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "./ui/checkbox";
import { useState } from "react";

export function MultiSelectPopover({ children, dataList, setDataList }) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="pl-6 min-w-0 ">
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={dataList?.every((item) => item.checked === true)}
              onCheckedChange={(e) => {
                const tmpDataList = JSON.parse(JSON.stringify(dataList));
                tmpDataList?.forEach((item) => (item.checked = e));
                setDataList(tmpDataList);
              }}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Tất cả
            </label>
          </div>
          {dataList?.map((e, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Checkbox
                checked={e.checked}
                onCheckedChange={(checked) => {
                  const tmpDataList = JSON.parse(JSON.stringify(dataList));
                  tmpDataList[i].checked = checked;
                  setDataList(tmpDataList);
                }}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {e.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
