import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

export default function JourneyLoading() {
    const { t } = useLanguage();
    return (
        <div className="w-full py-8 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-primary" />
            <span>{t("common.loading")}</span>
        </div>
    );
}

