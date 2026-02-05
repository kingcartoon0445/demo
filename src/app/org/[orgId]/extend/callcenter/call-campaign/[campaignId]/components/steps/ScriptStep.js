import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ScriptStep({ script, setScript }) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="script">Kịch bản</Label>
                <Textarea
                    id="script"
                    className="min-h-[200px] bg-bg1"
                    placeholder="Nhập nội dung kịch bản cuộc gọi của bạn ở đây..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                />
            </div>
        </div>
    );
} 