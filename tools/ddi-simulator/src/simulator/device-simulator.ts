import { DdiClient } from '../api/ddi-client.js';
import type {
    DdiControllerBase,
    DdiDeploymentBase,
    DdiActionFeedback,
    DdiChunk,
    DdiArtifact,
} from '../types/ddi.js';
import { logger } from '../utils/logger.js';

export interface SimulatorOptions {
    /** Polling interval in seconds (default: from server or 10s) */
    pollingInterval?: number;
    /** Auto-confirm deployments */
    autoConfirm?: boolean;
    /** Simulate download (delay in ms per MB, default: 100) */
    downloadSimulationRate?: number;
    /** Simulate installation (delay in ms, default: 2000) */
    installSimulationDelay?: number;
    /** Device attributes to send on configData request */
    deviceAttributes?: Record<string, string>;
}

export class DeviceSimulator {
    private client: DdiClient;
    private options: Required<SimulatorOptions>;
    private running: boolean = false;
    private pollTimer: NodeJS.Timeout | null = null;
    private lastEtag: string | null = null;

    constructor(client: DdiClient, options: SimulatorOptions = {}) {
        this.client = client;
        this.options = {
            pollingInterval: options.pollingInterval || 10,
            autoConfirm: options.autoConfirm ?? true,
            downloadSimulationRate: options.downloadSimulationRate ?? 100,
            installSimulationDelay: options.installSimulationDelay ?? 2000,
            deviceAttributes: options.deviceAttributes ?? {
                'device.type': 'simulator',
                'device.version': '1.0.0',
            },
        };
    }

    /**
     * Start the simulator polling loop
     */
    async start(): Promise<void> {
        if (this.running) {
            logger.warn('Simulator is already running');
            return;
        }

        this.running = true;
        logger.success('Simulator started');

        // Initial poll
        await this.poll();

        // Start polling loop
        this.schedulePoll();
    }

    /**
     * Stop the simulator
     */
    stop(): void {
        this.running = false;
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        logger.info('Simulator stopped');
    }

    private schedulePoll(): void {
        if (!this.running) return;

        this.pollTimer = setTimeout(async () => {
            await this.poll();
            this.schedulePoll();
        }, this.options.pollingInterval * 1000);
    }

    /**
     * Main polling logic
     */
    private async poll(): Promise<void> {
        try {
            logger.poll('Polling server...');
            const controllerBase = await this.client.getControllerBase();

            // Update polling interval from server if provided
            if (controllerBase.config?.polling?.sleep) {
                const serverInterval = DdiClient.parsePollingInterval(controllerBase.config.polling.sleep);
                if (serverInterval !== this.options.pollingInterval) {
                    logger.info(`Updating polling interval to ${serverInterval}s (from server)`);
                    this.options.pollingInterval = serverInterval;
                }
            }

            // Check for pending actions
            const links = controllerBase._links || {};

            // Handle configData request
            if (links['configData']) {
                await this.handleConfigData();
            }

            // Handle deployment
            if (links['deploymentBase']) {
                const actionId = DdiClient.extractActionId(links['deploymentBase'].href);
                if (actionId) {
                    await this.handleDeployment(actionId);
                }
            }

            // Handle cancel
            if (links['cancelAction']) {
                const match = links['cancelAction'].href.match(/cancelAction\/(\d+)/);
                if (match) {
                    await this.handleCancel(match[1]);
                }
            }

            // Handle confirmation
            if (links['confirmationBase']) {
                await this.handleConfirmation();
            }

            if (!links['deploymentBase'] && !links['cancelAction']) {
                logger.poll('No pending actions');
            }
        } catch (error) {
            logger.error('Polling failed:', error instanceof Error ? error.message : error);
        }
    }

    /**
     * Handle configData request - send device attributes
     */
    private async handleConfigData(): Promise<void> {
        try {
            logger.info('Sending device attributes...');
            await this.client.putConfigData({
                mode: 'merge',
                data: this.options.deviceAttributes,
            });
            logger.success('Device attributes sent');
        } catch (error) {
            logger.error('Failed to send config data:', error instanceof Error ? error.message : error);
        }
    }

    /**
     * Handle deployment action
     */
    private async handleDeployment(actionId: string): Promise<void> {
        try {
            logger.deployment(`Deployment detected! Action ID: ${actionId}`);

            // Get deployment details
            const deployment = await this.client.getDeploymentBase(actionId);
            this.logDeploymentInfo(deployment);

            // Send proceeding feedback
            await this.sendFeedback(actionId, 'proceeding', 'none', ['Starting deployment...']);

            // Simulate download
            await this.simulateDownload(deployment);

            // Send downloaded feedback
            await this.sendFeedback(actionId, 'downloaded', 'none', ['Download complete']);

            // Simulate installation
            logger.info('Installing... (simulated)');
            await this.delay(this.options.installSimulationDelay);

            // Send success feedback
            await this.sendFeedback(actionId, 'closed', 'success', ['Installation complete']);
            logger.success('Deployment completed successfully!');
        } catch (error) {
            logger.error('Deployment failed:', error instanceof Error ? error.message : error);
            try {
                await this.sendFeedback(actionId, 'closed', 'failure', [
                    `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                ]);
            } catch {
                // Ignore feedback error
            }
        }
    }

    /**
     * Handle cancel action
     */
    private async handleCancel(actionId: string): Promise<void> {
        try {
            logger.warn(`Cancel action detected! Action ID: ${actionId}`);
            const cancelInfo = await this.client.getCancelAction(actionId);

            logger.info(`Canceling action ${cancelInfo.cancelAction.stopId}`);

            // Accept the cancellation
            await this.client.postCancelFeedback(actionId, {
                status: {
                    execution: 'closed',
                    result: { finished: 'success' },
                    details: ['Cancellation accepted'],
                },
            });

            logger.success('Cancellation acknowledged');
        } catch (error) {
            logger.error('Cancel handling failed:', error instanceof Error ? error.message : error);
        }
    }

    /**
     * Handle confirmation request
     */
    private async handleConfirmation(): Promise<void> {
        try {
            const confirmationBase = await this.client.getConfirmationBase();
            const links = confirmationBase._links || {};

            // Check for pending confirmation
            const confirmationLink = Object.keys(links).find((key) =>
                key.startsWith('confirmationBase') && key !== 'confirmationBase'
            );

            if (confirmationLink) {
                const match = links[confirmationLink].href.match(/confirmationBase\/(\d+)/);
                if (match && this.options.autoConfirm) {
                    logger.info(`Auto-confirming action ${match[1]}`);
                    await this.client.postConfirmationFeedback(match[1], {
                        confirmation: 'confirmed',
                        details: ['Auto-confirmed by simulator'],
                    });
                    logger.success('Action confirmed');
                }
            }
        } catch (error) {
            logger.error('Confirmation handling failed:', error instanceof Error ? error.message : error);
        }
    }

    /**
     * Simulate artifact download
     */
    private async simulateDownload(deployment: DdiDeploymentBase): Promise<void> {
        for (const chunk of deployment.deployment.chunks) {
            logger.info(`Processing chunk: ${chunk.name} (${chunk.part}) v${chunk.version}`);

            for (const artifact of chunk.artifacts || []) {
                const sizeMB = (artifact.size || 0) / (1024 * 1024);
                const downloadTime = Math.max(100, sizeMB * this.options.downloadSimulationRate);

                logger.download(`Downloading: ${artifact.filename} (${this.formatSize(artifact.size || 0)})`);
                await this.delay(downloadTime);
                logger.success(`Downloaded: ${artifact.filename}`);
            }
        }
    }

    /**
     * Send action feedback
     */
    private async sendFeedback(
        actionId: string,
        execution: string,
        finished: string,
        details: string[]
    ): Promise<void> {
        logger.upload(`Sending feedback: ${execution}`);

        const feedback: DdiActionFeedback = {
            status: {
                execution: execution as DdiActionFeedback['status']['execution'],
                result: {
                    finished: finished as DdiActionFeedback['status']['result']['finished'],
                },
                details,
            },
            timestamp: Date.now(),
        };

        await this.client.postDeploymentFeedback(actionId, feedback);
    }

    /**
     * Log deployment info
     */
    private logDeploymentInfo(deployment: DdiDeploymentBase): void {
        const chunks = deployment.deployment.chunks;
        const totalArtifacts = chunks.reduce((sum, c) => sum + (c.artifacts?.length || 0), 0);
        const totalSize = chunks.reduce(
            (sum, c) => sum + (c.artifacts?.reduce((s, a) => s + (a.size || 0), 0) || 0),
            0
        );

        logger.info(`  Chunks: ${chunks.length}, Artifacts: ${totalArtifacts}, Total: ${this.formatSize(totalSize)}`);

        for (const chunk of chunks) {
            logger.debug(`  - ${chunk.name} (${chunk.part}) v${chunk.version}`);
        }
    }

    private formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
