import { useState, useEffect } from "react";
import { getUnlayerService, UnlayerTemplate } from "@/services/unlayerService";

export interface UnlayerTemplateItem {
    id: string;
    name: string;
    subject?: string;
    thumbnail?: string | null;
    html?: string | null;
    design?: any;
    source: "unlayer";
}

export const useUnlayerTemplates = (apiKey?: string) => {
    const [templates, setTemplates] = useState<UnlayerTemplateItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = async () => {
        if (!apiKey) {
            setError("Library API key is required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const unlayerService = getUnlayerService(apiKey);
            const response = await unlayerService.getTemplates(1, 50); // Get first 50 templates

            const formattedTemplates: UnlayerTemplateItem[] = response.data.map(
                (template) => ({
                    id: `unlayer_${template.id}`,
                    name: template.name,
                    subject: template.description || template.name,
                    thumbnail: template.thumbnail || null,
                    html: template.html || null,
                    design: template.design,
                    source: "unlayer" as const,
                })
            );

            setTemplates(formattedTemplates);
        } catch (err) {
            console.error("Error fetching library templates:", err);
            setError(
                err instanceof Error ? err.message : "Failed to fetch templates"
            );
        } finally {
            setLoading(false);
        }
    };

    const exportTemplate = async (
        templateId: number
    ): Promise<{ html: string; design: any } | null> => {
        if (!apiKey) return null;

        try {
            const unlayerService = getUnlayerService(apiKey);
            const response = await unlayerService.exportTemplate(templateId);
            return response.data;
        } catch (err) {
            console.error("Error exporting library template:", err);
            return null;
        }
    };

    useEffect(() => {
        if (apiKey) {
            fetchTemplates();
        }
    }, [apiKey]);

    return {
        templates,
        loading,
        error,
        refetch: fetchTemplates,
        exportTemplate,
    };
};
