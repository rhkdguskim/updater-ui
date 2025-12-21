import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
    DdiControllerBase,
    DdiDeploymentBase,
    DdiActionFeedback,
    DdiConfigData,
    DdiCancel,
    DdiConfirmationBase,
    DdiConfirmationBaseAction,
    DdiConfirmationFeedback,
    DdiActivateAutoConfirmation,
    DdiArtifact,
    ExceptionInfo,
} from '../types/ddi.js';
import { logger } from '../utils/logger.js';

export interface DdiClientOptions {
    baseUrl: string;
    tenant: string;
    controllerId: string;
    /** Basic Auth username */
    username?: string;
    /** Basic Auth password */
    password?: string;
    gatewayToken?: string;
    targetToken?: string;
    timeout?: number;
}

export class DdiClient {
    private client: AxiosInstance;
    private tenant: string;
    private controllerId: string;

    constructor(options: DdiClientOptions) {
        this.tenant = options.tenant;
        this.controllerId = options.controllerId;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        // Authentication priority: Basic Auth > GatewayToken > TargetToken
        if (options.username && options.password) {
            const credentials = Buffer.from(`${options.username}:${options.password}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
        } else if (options.gatewayToken) {
            headers['Authorization'] = `GatewayToken ${options.gatewayToken}`;
        } else if (options.targetToken) {
            headers['Authorization'] = `TargetToken ${options.targetToken}`;
        }

        this.client = axios.create({
            baseURL: options.baseUrl,
            timeout: options.timeout || 30000,
            headers,
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError<ExceptionInfo>) => {
                if (error.response) {
                    const { status, data } = error.response;
                    logger.error(`HTTP ${status}: ${data?.message || error.message}`);
                } else if (error.request) {
                    logger.error('No response received:', error.message);
                } else {
                    logger.error('Request error:', error.message);
                }
                throw error;
            }
        );
    }

    private get basePath(): string {
        return `/${this.tenant}/controller/v1/${this.controllerId}`;
    }

    /**
     * Get controller base - main polling endpoint
     * Returns links to pending actions (deploymentBase, configData, etc.)
     */
    async getControllerBase(): Promise<DdiControllerBase> {
        const response = await this.client.get<DdiControllerBase>(this.basePath);
        return response.data;
    }

    /**
     * Get deployment base details for a specific action
     */
    async getDeploymentBase(actionId: string | number, actionHistory?: number): Promise<DdiDeploymentBase> {
        const params = actionHistory ? { actionHistory } : undefined;
        const response = await this.client.get<DdiDeploymentBase>(
            `${this.basePath}/deploymentBase/${actionId}`,
            { params }
        );
        return response.data;
    }

    /**
     * Send deployment action feedback
     */
    async postDeploymentFeedback(actionId: string | number, feedback: DdiActionFeedback): Promise<void> {
        await this.client.post(`${this.basePath}/deploymentBase/${actionId}/feedback`, feedback);
    }

    /**
     * Get installed base (previously installed action)
     */
    async getInstalledBase(actionId: string | number, actionHistory?: number): Promise<DdiDeploymentBase> {
        const params = actionHistory ? { actionHistory } : undefined;
        const response = await this.client.get<DdiDeploymentBase>(
            `${this.basePath}/installedBase/${actionId}`,
            { params }
        );
        return response.data;
    }

    /**
     * Update config data (device attributes)
     */
    async putConfigData(data: DdiConfigData): Promise<void> {
        await this.client.put(`${this.basePath}/configData`, data);
    }

    /**
     * Get cancel action details
     */
    async getCancelAction(actionId: string | number): Promise<DdiCancel> {
        const response = await this.client.get<DdiCancel>(
            `${this.basePath}/cancelAction/${actionId}`
        );
        return response.data;
    }

    /**
     * Send cancel action feedback
     */
    async postCancelFeedback(actionId: string | number, feedback: DdiActionFeedback): Promise<void> {
        await this.client.post(`${this.basePath}/cancelAction/${actionId}/feedback`, feedback);
    }

    /**
     * Get confirmation base
     */
    async getConfirmationBase(): Promise<DdiConfirmationBase> {
        const response = await this.client.get<DdiConfirmationBase>(
            `${this.basePath}/confirmationBase`
        );
        return response.data;
    }

    /**
     * Get confirmation action details
     */
    async getConfirmationAction(actionId: string | number): Promise<DdiConfirmationBaseAction> {
        const response = await this.client.get<DdiConfirmationBaseAction>(
            `${this.basePath}/confirmationBase/${actionId}`
        );
        return response.data;
    }

    /**
     * Send confirmation feedback (confirm or deny)
     */
    async postConfirmationFeedback(actionId: string | number, feedback: DdiConfirmationFeedback): Promise<void> {
        await this.client.post(`${this.basePath}/confirmationBase/${actionId}/feedback`, feedback);
    }

    /**
     * Activate auto-confirmation
     */
    async activateAutoConfirmation(data?: DdiActivateAutoConfirmation): Promise<void> {
        await this.client.post(`${this.basePath}/confirmationBase/activateAutoConfirm`, data || {});
    }

    /**
     * Deactivate auto-confirmation
     */
    async deactivateAutoConfirmation(): Promise<void> {
        await this.client.post(`${this.basePath}/confirmationBase/deactivateAutoConfirm`);
    }

    /**
     * Get software module artifacts
     */
    async getArtifacts(softwareModuleId: string | number): Promise<DdiArtifact[]> {
        const response = await this.client.get<DdiArtifact[]>(
            `${this.basePath}/softwaremodules/${softwareModuleId}/artifacts`
        );
        return response.data;
    }

    /**
     * Download artifact (returns as buffer)
     */
    async downloadArtifact(softwareModuleId: string | number, fileName: string): Promise<Buffer> {
        const response = await this.client.get(
            `${this.basePath}/softwaremodules/${softwareModuleId}/artifacts/${fileName}`,
            { responseType: 'arraybuffer' }
        );
        return Buffer.from(response.data);
    }

    /**
     * Helper to extract action ID from deployment link
     */
    static extractActionId(href: string): string | null {
        const match = href.match(/deploymentBase\/(\d+)/);
        return match ? match[1] : null;
    }

    /**
     * Helper to parse polling interval from sleep string (HH:MM:SS)
     */
    static parsePollingInterval(sleep: string): number {
        const parts = sleep.split(':').map(Number);
        if (parts.length !== 3) return 60; // default 60 seconds
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    }
}
