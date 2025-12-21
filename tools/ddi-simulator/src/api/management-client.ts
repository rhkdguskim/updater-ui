import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger.js';

export interface MgmtTarget {
    controllerId: string;
    name: string;
    description?: string;
    securityToken: string;
    address?: string;
    updateStatus?: string;
    _links?: Record<string, { href: string }>;
}

export interface MgmtTargetRequestBody {
    controllerId: string;
    name: string;
    description?: string;
    targetType?: number;
}

export interface ManagementClientOptions {
    baseUrl: string;
    username: string;
    password: string;
    timeout?: number;
}

/**
 * Management API Client for Target operations
 * Used to create/manage devices through the admin API
 */
export class ManagementClient {
    private client: AxiosInstance;

    constructor(options: ManagementClientOptions) {
        const credentials = Buffer.from(`${options.username}:${options.password}`).toString('base64');

        this.client = axios.create({
            baseURL: options.baseUrl,
            timeout: options.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${credentials}`,
            },
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response) {
                    const { status, data } = error.response;
                    logger.error(`Management API HTTP ${status}:`, (data as { message?: string })?.message || error.message);
                }
                throw error;
            }
        );
    }

    /**
     * Create a new target and get its security token
     * If target already exists (409) or access denied (403), tries to fetch existing
     */
    async createTarget(controllerId: string, name: string, description?: string): Promise<MgmtTarget> {
        const body: MgmtTargetRequestBody[] = [{
            controllerId,
            name,
            description,
        }];

        try {
            const response = await this.client.post<MgmtTarget[]>('/rest/v1/targets', body);
            if (response.data.length > 0) {
                return response.data[0];
            }
            throw new Error('No target returned from creation');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                // 409: Conflict (already exists), 403: Forbidden (might be rate limit or existing)
                if (status === 409 || status === 403) {
                    logger.warn(`Target ${controllerId} may already exist, fetching...`);
                    try {
                        return await this.getTarget(controllerId);
                    } catch (fetchError) {
                        // If we can't fetch either, throw original error
                        throw error;
                    }
                }
            }
            throw error;
        }
    }

    /**
     * Get or create a target - always returns a target if accessible
     */
    async getOrCreateTarget(controllerId: string, name?: string, description?: string): Promise<MgmtTarget> {
        try {
            // Try to get existing target first
            return await this.getTarget(controllerId);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // Target doesn't exist, create it
                return await this.createTarget(controllerId, name || controllerId, description);
            }
            throw error;
        }
    }

    /**
     * Get target by controller ID
     */
    async getTarget(controllerId: string): Promise<MgmtTarget> {
        const response = await this.client.get<MgmtTarget>(`/rest/v1/targets/${controllerId}`);
        return response.data;
    }

    /**
     * Delete target by controller ID
     */
    async deleteTarget(controllerId: string): Promise<void> {
        await this.client.delete(`/rest/v1/targets/${controllerId}`);
    }

    /**
     * Check if target exists
     */
    async targetExists(controllerId: string): Promise<boolean> {
        try {
            await this.getTarget(controllerId);
            return true;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Create multiple targets
     */
    async createTargets(targets: MgmtTargetRequestBody[]): Promise<MgmtTarget[]> {
        const response = await this.client.post<MgmtTarget[]>('/rest/v1/targets', targets);
        return response.data;
    }
}
