import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { updateCallcampaignContent } from "@/api/callcenter";
import { MdEdit, MdOutlineEdit } from "react-icons/md";

export default function ScriptTab({ script, setRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(script);
  const params = useParams();

  const handleSave = async () => {
    try {
      await updateCallcampaignContent(params.orgId, params.campaignId, {
        content: content,
      });
      setIsEditing(false);
      toast.success("Cập nhật kịch bản thành công");
      setRefresh((prev) => !prev);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật kịch bản");
    }
  };

  return (
    <div >
      <div className="flex items-center justify-between mt-6 mb-2">
        <div className="text-lg font-medium">Nội dung</div>
        {isEditing ? (
          <div className="space-x-2">
            <Button onClick={() => setIsEditing(false)} variant="outline">
              Hủy
            </Button>
            <Button onClick={handleSave}>Lưu</Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="flex h-[34px] items-center text-primary hover:text-primary/80 border-primary hover:border-primary/80"
          >
            <MdOutlineEdit className="mr-1 text-xl" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] outline outline-1 outline-gray-200 rounded-md p-2 focus:!outline-gray-200"
          placeholder="Nhập nội dung kịch bản..."
        />
      ) : (
        <div className="whitespace-pre-wrap rounded-md p-4">
          {!content || content.trim() === "" ? (
            <span className="text-gray-500 italic">
              Chưa có nội dung kịch bản
            </span>
          ) : (
            content
          )}
        </div>
      )}
    </div>
  );
}
