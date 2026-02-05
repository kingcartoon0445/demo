// Unlayer API service
export interface UnlayerTemplate {
    id: number;
    name: string;
    description?: string;
    thumbnail?: string;
    design: any; // JSON design object
    html?: string;
    created_at: string;
    updated_at: string;
}

export interface UnlayerApiResponse {
    data: UnlayerTemplate[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
}

class UnlayerService {
    private readonly baseUrl = "https://api.unlayer.com/v2";
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Basic ${btoa(
                    "0L1oizuep38x8pMbMJxJaDdImIoUg0kOammmiMlS77rZZhhzB7SIloBTdGWNcPSk"
                )}`,
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(
                `Unlayer API error: ${response.status} ${response.statusText}`
            );
        }

        return response.json();
    }

    async getTemplates(page = 1, perPage = 20): Promise<UnlayerApiResponse> {
        return this.request<UnlayerApiResponse>(
            `/templates?page=${page}&per_page=${perPage}`
        );
    }

    async getTemplate(templateId: number): Promise<{ data: UnlayerTemplate }> {
        return this.request<{ data: UnlayerTemplate }>(
            `/templates/${templateId}`
        );
    }

    async exportTemplate(
        templateId: number
    ): Promise<{ data: { html: string; design: any } }> {
        return this.request<{ data: { html: string; design: any } }>(
            `/templates/${templateId}/export`,
            {
                method: "POST",
            }
        );
    }
}

// Singleton instance
let unlayerService: UnlayerService | null = null;

export const getUnlayerService = (apiKey?: string): UnlayerService => {
    if (!unlayerService) {
        const key = apiKey || process.env.NEXT_PUBLIC_UNLAYER_API_KEY || "";
        if (!key) {
            throw new Error("Unlayer API key is required");
        }
        unlayerService = new UnlayerService(key);
    }
    return unlayerService;
};

export default UnlayerService;
