export declare function getN8nApiConfig(): {
    baseUrl: string;
    apiKey: string;
    restEmail: string | undefined;
    restPassword: string | undefined;
    restProjectEmail: string | undefined;
    restProjectId: string | undefined;
    timeout: number;
    maxRetries: number;
} | null;
export declare function isN8nApiConfigured(): boolean;
export declare function getN8nApiConfigFromContext(context: {
    n8nApiUrl?: string;
    n8nApiKey?: string;
    n8nApiTimeout?: number;
    n8nApiMaxRetries?: number;
    n8nRestEmail?: string;
    n8nRestPassword?: string;
    n8nRestProjectEmail?: string;
    n8nRestProjectId?: string;
}): N8nApiConfig | null;
export type N8nApiConfig = NonNullable<ReturnType<typeof getN8nApiConfig>>;
//# sourceMappingURL=n8n-api.d.ts.map