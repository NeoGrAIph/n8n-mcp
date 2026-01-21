import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';
import {
  Workflow,
  WorkflowListParams,
  WorkflowListResponse,
  Execution,
  ExecutionListParams,
  ExecutionListResponse,
  Credential,
  CredentialListParams,
  CredentialListResponse,
  Tag,
  TagListParams,
  TagListResponse,
  Folder,
  FolderListParams,
  FolderListResponse,
  Project,
  HealthCheckResponse,
  N8nVersionInfo,
  Variable,
  WebhookRequest,
  WorkflowExport,
  WorkflowImport,
  SourceControlStatus,
  SourceControlPullResult,
  SourceControlPushResult,
} from '../types/n8n-api';
import { handleN8nApiError, logN8nError, N8nApiError } from '../utils/n8n-errors';
import { cleanWorkflowForCreate, cleanWorkflowForUpdate } from './n8n-validation';
import {
  fetchN8nVersion,
  cleanSettingsForVersion,
  getCachedVersion,
} from './n8n-version';

export interface N8nApiClientConfig {
  baseUrl: string;
  apiKey: string;
  restEmail?: string;
  restPassword?: string;
  restProjectEmail?: string;
  restProjectId?: string;
  timeout?: number;
  maxRetries?: number;
}

export class N8nApiClient {
  private client: AxiosInstance;
  private restClient: AxiosInstance;
  private maxRetries: number;
  private baseUrl: string;
  private restBaseUrl: string;
  private restAuthEmail?: string;
  private restAuthPassword?: string;
  private restProjectEmail?: string;
  private restProjectId?: string;
  private restCookie?: string;
  private restAuthPromise: Promise<void> | null = null;
  private timeout: number;
  private versionInfo: N8nVersionInfo | null = null;
  private versionPromise: Promise<N8nVersionInfo | null> | null = null;

  constructor(config: N8nApiClientConfig) {
    const {
      baseUrl,
      apiKey,
      restEmail,
      restPassword,
      restProjectEmail,
      restProjectId,
      timeout = 30000,
      maxRetries = 3
    } = config;

    this.maxRetries = maxRetries;
    this.baseUrl = baseUrl;
    this.restAuthEmail = restEmail;
    this.restAuthPassword = restPassword;
    this.restProjectEmail = restProjectEmail;
    this.restProjectId = restProjectId;
    this.timeout = timeout;

    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    const apiUrl = normalizedBaseUrl.endsWith('/api/v1')
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/api/v1`;
    this.restBaseUrl = normalizedBaseUrl.replace(/\/api\/v1\/?$/, '');
    const restUrl = `${this.restBaseUrl}/rest`;

    const createClient = (baseURL: string, label: string): AxiosInstance => {
      const client = axios.create({
        baseURL,
        timeout,
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      });

      client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          logger.debug(`n8n API Request (${label}): ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
          return config;
        },
        (error: unknown) => {
          logger.error(`n8n API Request Error (${label}):`, error);
          return Promise.reject(error);
        }
      );

      client.interceptors.response.use(
        (response: any) => {
          logger.debug(`n8n API Response (${label}): ${response.status} ${response.config.url}`);
          return response;
        },
        (error: unknown) => {
          const n8nError = handleN8nApiError(error);
          logN8nError(n8nError, `n8n API Response (${label})`);
          return Promise.reject(n8nError);
        }
      );

      return client;
    };

    this.client = createClient(apiUrl, 'public');
    this.restClient = createClient(restUrl, 'rest');
  }

  private hasRestAuth(): boolean {
    return Boolean(this.restAuthEmail && this.restAuthPassword);
  }

  private normalizeSetCookie(setCookie?: string[] | string): string | null {
    if (!setCookie) return null;
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    const pairs = cookies
      .map((cookie) => cookie.split(';')[0]?.trim())
      .filter((pair) => Boolean(pair));
    return pairs.length > 0 ? pairs.join('; ') : null;
  }

  private setRestCookieHeader(cookie: string): void {
    this.restCookie = cookie;
    this.restClient.defaults.headers.Cookie = cookie;
  }

  private async loginRest(): Promise<void> {
    if (!this.hasRestAuth()) return;
    const loginUrl = `${this.restBaseUrl}/rest/login`;
    const response = await axios.post(
      loginUrl,
      {
        emailOrLdapLoginId: this.restAuthEmail,
        password: this.restAuthPassword,
      },
      {
        timeout: this.timeout,
        validateStatus: (status) => status < 500,
      }
    );

    if (response.status !== 200) {
      throw new Error(`REST login failed with HTTP ${response.status}`);
    }

    const cookie = this.normalizeSetCookie(response.headers?.['set-cookie']);
    if (!cookie) {
      throw new Error('REST login succeeded but no session cookie was returned');
    }

    this.setRestCookieHeader(cookie);
  }

  private async ensureRestAuth(): Promise<void> {
    if (!this.hasRestAuth()) return;
    if (this.restCookie) return;
    if (this.restAuthPromise) {
      await this.restAuthPromise;
      return;
    }

    this.restAuthPromise = this.loginRest();
    try {
      await this.restAuthPromise;
    } finally {
      this.restAuthPromise = null;
    }
  }

  private async requestRest<T>(config: AxiosRequestConfig): Promise<T> {
    if (this.hasRestAuth()) {
      await this.ensureRestAuth();
    }

    try {
      const response = await this.restClient.request<T>(config);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        if (!this.hasRestAuth()) {
          throw new Error(
            'REST authentication required. Configure N8N_REST_EMAIL and N8N_REST_PASSWORD to use folder tools.'
          );
        }
        this.restCookie = undefined;
        await this.ensureRestAuth();
        const retryResponse = await this.restClient.request<T>(config);
        return retryResponse.data;
      }
      throw error;
    }
  }

  private async resolveProjectId(explicitProjectId?: string): Promise<string> {
    if (explicitProjectId) return explicitProjectId;
    if (this.restProjectId) return this.restProjectId;

    const projects = await this.requestRest<Project[]>({
      method: 'get',
      url: '/projects',
    }).then((data) => {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray((data as any).data)) {
        return (data as any).data as Project[];
      }
      return [];
    });

    if (projects.length === 0) {
      throw new Error('Unable to resolve projectId: no projects returned by REST API');
    }

    const personalProjects = projects.filter((p) => p.type === 'personal');
    if (personalProjects.length === 0) {
      throw new Error('Unable to resolve projectId: no personal projects found');
    }

    const targetEmail = this.restProjectEmail?.toLowerCase();
    if (targetEmail) {
      const match = personalProjects.find((p) => p.name?.toLowerCase().includes(targetEmail));
      if (!match) {
        throw new Error(`Unable to resolve projectId: no personal project found for ${this.restProjectEmail}`);
      }
      return match.id;
    }

    const email = this.restAuthEmail?.toLowerCase();
    const match = email
      ? personalProjects.find((p) => p.name?.toLowerCase().includes(email))
      : undefined;

    return (match ?? personalProjects[0]).id;
  }

  /**
   * Get the n8n version, fetching it if not already cached.
   * Uses promise-based locking to prevent concurrent requests.
   */
  async getVersion(): Promise<N8nVersionInfo | null> {
    // If we already have version info, return it
    if (this.versionInfo) {
      return this.versionInfo;
    }

    // If a fetch is already in progress, wait for it
    if (this.versionPromise) {
      return this.versionPromise;
    }

    // Start a new fetch with promise-based locking
    this.versionPromise = this.fetchVersionOnce();
    try {
      this.versionInfo = await this.versionPromise;
      return this.versionInfo;
    } finally {
      // Clear the promise so future calls can retry if needed
      this.versionPromise = null;
    }
  }

  /**
   * Internal method to fetch version once
   */
  private async fetchVersionOnce(): Promise<N8nVersionInfo | null> {
    // Check if already cached globally
    let version = getCachedVersion(this.baseUrl);
    if (!version) {
      // Fetch from server
      version = await fetchN8nVersion(this.baseUrl);
    }
    return version;
  }

  /**
   * Get cached version info without fetching
   */
  getCachedVersionInfo(): N8nVersionInfo | null {
    return this.versionInfo;
  }

  // Health check to verify API connectivity
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      // Try the standard healthz endpoint (available on all n8n instances)
      const baseUrl = this.client.defaults.baseURL || '';
      const healthzUrl = baseUrl.replace(/\/api\/v\d+\/?$/, '') + '/healthz';

      const response = await axios.get(healthzUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });

      // Also fetch version info (will be cached)
      const versionInfo = await this.getVersion();

      if (response.status === 200 && response.data?.status === 'ok') {
        return {
          status: 'ok',
          n8nVersion: versionInfo?.version,
          features: {}
        };
      }

      // If healthz doesn't work, fall back to API check
      throw new Error('healthz endpoint not available');
    } catch (error) {
      // If healthz endpoint doesn't exist, try listing workflows with limit 1
      // This is a fallback for older n8n versions
      try {
        await this.client.get('/workflows', { params: { limit: 1 } });

        // Still try to get version
        const versionInfo = await this.getVersion();

        return {
          status: 'ok',
          n8nVersion: versionInfo?.version,
          features: {}
        };
      } catch (fallbackError) {
        throw handleN8nApiError(fallbackError);
      }
    }
  }

  // Workflow Management
  async createWorkflow(workflow: Partial<Workflow>): Promise<Workflow> {
    try {
      const cleanedWorkflow = cleanWorkflowForCreate(workflow);
      const response = await this.client.post('/workflows', cleanedWorkflow);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async getWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.get(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    try {
      // Step 1: Basic cleaning (remove read-only fields, filter to known settings)
      const cleanedWorkflow = cleanWorkflowForUpdate(workflow as Workflow);

      // Step 2: Version-aware settings filtering for older n8n compatibility
      // This prevents "additional properties" errors on n8n < 1.119.0
      const versionInfo = await this.getVersion();
      if (versionInfo) {
        logger.debug(`Updating workflow with n8n version ${versionInfo.version}`);
        // Apply version-specific filtering to settings
        cleanedWorkflow.settings = cleanSettingsForVersion(
          cleanedWorkflow.settings as Record<string, unknown>,
          versionInfo
        );
      } else {
        logger.warn('Could not determine n8n version, sending all known settings properties');
        // Without version info, we send all known properties (might fail on old n8n)
      }

      // First, try PUT method (newer n8n versions)
      try {
        const response = await this.client.put(`/workflows/${id}`, cleanedWorkflow);
        return response.data;
      } catch (putError: any) {
        const status =
          putError?.response?.status ??
          putError?.statusCode ??
          putError?.status ??
          (putError instanceof N8nApiError ? putError.statusCode : undefined);
        // If PUT fails with 405 (Method Not Allowed), try PATCH
        if (status === 405) {
          logger.debug('PUT method not supported, falling back to PATCH');
          const response = await this.client.patch(`/workflows/${id}`, cleanedWorkflow);
          return response.data;
        }
        throw putError;
      }
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async deleteWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.delete(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async activateWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.post(`/workflows/${id}/activate`);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async deactivateWorkflow(id: string): Promise<Workflow> {
    try {
      const response = await this.client.post(`/workflows/${id}/deactivate`);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  /**
   * Lists workflows from n8n instance.
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of workflows
   *
   * @remarks
   * This method handles two response formats for backwards compatibility:
   * - Modern (n8n v0.200.0+): {data: Workflow[], nextCursor?: string}
   * - Legacy (older versions): Workflow[] (wrapped automatically)
   *
   * @see https://github.com/czlonkowski/n8n-mcp/issues/349
   */
  async listWorkflows(params: WorkflowListParams = {}): Promise<WorkflowListResponse> {
    try {
      const response = await this.client.get('/workflows', { params });
      return this.validateListResponse<Workflow>(response.data, 'workflows');
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  // Execution Management
  async getExecution(id: string, includeData = false): Promise<Execution> {
    try {
      const response = await this.client.get(`/executions/${id}`, {
        params: { includeData },
      });
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  /**
   * Lists executions from n8n instance.
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of executions
   *
   * @remarks
   * This method handles two response formats for backwards compatibility:
   * - Modern (n8n v0.200.0+): {data: Execution[], nextCursor?: string}
   * - Legacy (older versions): Execution[] (wrapped automatically)
   *
   * @see https://github.com/czlonkowski/n8n-mcp/issues/349
   */
  async listExecutions(params: ExecutionListParams = {}): Promise<ExecutionListResponse> {
    try {
      const response = await this.client.get('/executions', { params });
      return this.validateListResponse<Execution>(response.data, 'executions');
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async deleteExecution(id: string): Promise<void> {
    try {
      await this.client.delete(`/executions/${id}`);
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  // Folder Management (internal REST API)
  async listFolders(params: FolderListParams): Promise<FolderListResponse> {
    try {
      const { projectId, filter, ...rest } = params;
      const resolvedProjectId = await this.resolveProjectId(projectId);
      const query: Record<string, unknown> = { ...rest };
      if (filter !== undefined) {
        query.filter = typeof filter === 'string' ? filter : JSON.stringify(filter);
      }
      const response = await this.requestRest<FolderListResponse>({
        method: 'get',
        url: `/projects/${resolvedProjectId}/folders`,
        params: query,
      });
      return this.validateListResponse<Folder>(response, 'folders');
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async createFolder(projectId: string | undefined, name: string, parentFolderId?: string | null): Promise<Folder> {
    try {
      const resolvedProjectId = await this.resolveProjectId(projectId);
      const payload: Record<string, unknown> = { name };
      if (parentFolderId !== undefined) {
        payload.parentFolderId = parentFolderId;
      }
      return await this.requestRest<Folder>({
        method: 'post',
        url: `/projects/${resolvedProjectId}/folders`,
        data: payload,
      });
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async updateFolder(
    projectId: string | undefined,
    folderId: string,
    updates: { name?: string; parentFolderId?: string | null }
  ): Promise<Folder> {
    try {
      const resolvedProjectId = await this.resolveProjectId(projectId);
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.parentFolderId !== undefined) payload.parentFolderId = updates.parentFolderId;

      try {
        return await this.requestRest<Folder>({
          method: 'patch',
          url: `/projects/${resolvedProjectId}/folders/${folderId}`,
          data: payload,
        });
      } catch (patchError: any) {
        if (patchError?.response?.status === 405) {
          return await this.requestRest<Folder>({
            method: 'put',
            url: `/projects/${resolvedProjectId}/folders/${folderId}`,
            data: payload,
          });
        }
        throw patchError;
      }
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async deleteFolder(projectId: string | undefined, folderId: string): Promise<void> {
    try {
      const resolvedProjectId = await this.resolveProjectId(projectId);
      await this.requestRest<void>({
        method: 'delete',
        url: `/projects/${resolvedProjectId}/folders/${folderId}`,
      });
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async moveWorkflowToFolder(id: string, parentFolderId: string | null): Promise<Workflow> {
    try {
      const payload = { parentFolderId };
      try {
        const response = await this.client.patch(`/workflows/${id}`, payload);
        return response.data;
      } catch (patchError: any) {
        const status =
          patchError?.response?.status ??
          patchError?.statusCode ??
          patchError?.status ??
          (patchError instanceof N8nApiError ? patchError.statusCode : undefined);
        if (status === 405) {
          const current = await this.getWorkflow(id);
          const updated = { ...current, parentFolderId };
          return await this.updateWorkflow(id, updated);
        }
        throw patchError;
      }
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  // Webhook Execution
  async triggerWebhook(request: WebhookRequest): Promise<any> {
    try {
      const { webhookUrl, httpMethod, data, headers, waitForResponse = true, timeoutMs } = request;

      // SECURITY: Validate URL for SSRF protection (includes DNS resolution)
      // See: https://github.com/czlonkowski/n8n-mcp/issues/265 (HIGH-03)
      const { SSRFProtection } = await import('../utils/ssrf-protection');
      const validation = await SSRFProtection.validateWebhookUrl(webhookUrl);

      if (!validation.valid) {
        throw new Error(`SSRF protection: ${validation.reason}`);
      }

      // Extract path from webhook URL
      const url = new URL(webhookUrl);
      const webhookPath = url.pathname;
      
      // Make request directly to webhook endpoint
      const config: AxiosRequestConfig = {
        method: httpMethod,
        url: webhookPath,
        headers: {
          ...headers,
          // Don't override API key header for webhook endpoints
          'X-N8N-API-KEY': undefined,
        },
        data: httpMethod !== 'GET' ? data : undefined,
        params: httpMethod === 'GET' ? data : undefined,
        // Webhooks might take longer
        timeout: typeof timeoutMs === 'number' ? timeoutMs : (waitForResponse ? 120000 : 30000),
      };

      // Create a new axios instance for webhook requests to avoid API interceptors
      const webhookClient = axios.create({
        baseURL: new URL('/', webhookUrl).toString(),
        validateStatus: (status: number) => status < 600, // Don't throw on 4xx/5xx to allow error payload parsing
      });

      const response = await webhookClient.request(config);
      
      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  // Credential Management
  /**
   * Lists credentials from n8n instance.
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of credentials
   *
   * @remarks
   * This method handles two response formats for backwards compatibility:
   * - Modern (n8n v0.200.0+): {data: Credential[], nextCursor?: string}
   * - Legacy (older versions): Credential[] (wrapped automatically)
   *
   * @see https://github.com/czlonkowski/n8n-mcp/issues/349
   */
  async listCredentials(params: CredentialListParams = {}): Promise<CredentialListResponse> {
    try {
      const response = await this.client.get('/credentials', { params });
      return this.validateListResponse<Credential>(response.data, 'credentials');
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async getCredential(id: string): Promise<Credential> {
    try {
      const response = await this.client.get(`/credentials/${id}`);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async createCredential(credential: Partial<Credential>): Promise<Credential> {
    try {
      const response = await this.client.post('/credentials', credential);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async updateCredential(id: string, credential: Partial<Credential>): Promise<Credential> {
    try {
      const response = await this.client.patch(`/credentials/${id}`, credential);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async deleteCredential(id: string): Promise<void> {
    try {
      await this.client.delete(`/credentials/${id}`);
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  // Tag Management
  /**
   * Lists tags from n8n instance.
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of tags
   *
   * @remarks
   * This method handles two response formats for backwards compatibility:
   * - Modern (n8n v0.200.0+): {data: Tag[], nextCursor?: string}
   * - Legacy (older versions): Tag[] (wrapped automatically)
   *
   * @see https://github.com/czlonkowski/n8n-mcp/issues/349
   */
  async listTags(params: TagListParams = {}): Promise<TagListResponse> {
    try {
      const response = await this.client.get('/tags', { params });
      return this.validateListResponse<Tag>(response.data, 'tags');
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async createTag(tag: Partial<Tag>): Promise<Tag> {
    try {
      const response = await this.client.post('/tags', tag);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
    try {
      const response = await this.client.patch(`/tags/${id}`, tag);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async deleteTag(id: string): Promise<void> {
    try {
      await this.client.delete(`/tags/${id}`);
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  // Source Control Management (Enterprise feature)
  async getSourceControlStatus(): Promise<SourceControlStatus> {
    try {
      const response = await this.client.get('/source-control/status');
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async pullSourceControl(force = false): Promise<SourceControlPullResult> {
    try {
      const response = await this.client.post('/source-control/pull', { force });
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async pushSourceControl(
    message: string,
    fileNames?: string[]
  ): Promise<SourceControlPushResult> {
    try {
      const response = await this.client.post('/source-control/push', {
        message,
        fileNames,
      });
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  // Variable Management (via Source Control API)
  async getVariables(): Promise<Variable[]> {
    try {
      const response = await this.client.get('/variables');
      return response.data.data || [];
    } catch (error) {
      // Variables might not be available in all n8n versions
      logger.warn('Variables API not available, returning empty array');
      return [];
    }
  }

  async createVariable(variable: Partial<Variable>): Promise<Variable> {
    try {
      const response = await this.client.post('/variables', variable);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async updateVariable(id: string, variable: Partial<Variable>): Promise<Variable> {
    try {
      const response = await this.client.patch(`/variables/${id}`, variable);
      return response.data;
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  async deleteVariable(id: string): Promise<void> {
    try {
      await this.client.delete(`/variables/${id}`);
    } catch (error) {
      throw handleN8nApiError(error);
    }
  }

  /**
   * Validates and normalizes n8n API list responses.
   * Handles both modern format {data: [], nextCursor?: string} and legacy array format.
   *
   * @param responseData - Raw response data from n8n API
   * @param resourceType - Resource type for error messages (e.g., 'workflows', 'executions')
   * @returns Normalized response in modern format
   * @throws Error if response structure is invalid
   */
  private validateListResponse<T>(
    responseData: any,
    resourceType: string
  ): { data: T[]; nextCursor?: string | null } {
    // Validate response structure
    if (!responseData || typeof responseData !== 'object') {
      throw new Error(`Invalid response from n8n API for ${resourceType}: response is not an object`);
    }

    // Handle legacy case where API returns array directly (older n8n versions)
    if (Array.isArray(responseData)) {
      logger.warn(
        `n8n API returned array directly instead of {data, nextCursor} object for ${resourceType}. ` +
        'Wrapping in expected format for backwards compatibility.'
      );
      return {
        data: responseData,
        nextCursor: null
      };
    }

    // Validate expected format {data: [], nextCursor?: string}
    if (!Array.isArray(responseData.data)) {
      const keys = Object.keys(responseData).slice(0, 5);
      const keysPreview = keys.length < Object.keys(responseData).length
        ? `${keys.join(', ')}...`
        : keys.join(', ');
      throw new Error(
        `Invalid response from n8n API for ${resourceType}: expected {data: [], nextCursor?: string}, ` +
        `got object with keys: [${keysPreview}]`
      );
    }

    return responseData;
  }
}
