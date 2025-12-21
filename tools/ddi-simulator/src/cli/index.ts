#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { DdiClient } from '../api/ddi-client.js';
import { ManagementClient } from '../api/management-client.js';
import { DeviceSimulator } from '../simulator/device-simulator.js';
import { logger } from '../utils/logger.js';

const program = new Command();

program
    .name('ddi-simulator')
    .description('Eclipse hawkBit DDI Device Simulator')
    .version('1.0.0');

program
    .command('simulate')
    .description('Start device simulation')
    .requiredOption('-u, --url <url>', 'hawkBit server URL (e.g., http://localhost:8080)')
    .requiredOption('-c, --controller-id <id>', 'Device controller ID')
    .option('-t, --tenant <tenant>', 'Tenant ID', 'default')
    .option('--username <username>', 'Basic Auth username (e.g., admin)')
    .option('--password <password>', 'Basic Auth password (e.g., admin)')
    .option('--gateway-token <token>', 'Gateway token for authentication')
    .option('--target-token <token>', 'Target token for authentication')
    .option('-i, --interval <seconds>', 'Polling interval in seconds', '10')
    .option('--auto-confirm', 'Automatically confirm pending actions', true)
    .option('--no-auto-confirm', 'Disable auto-confirmation')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('-a, --attribute <key=value>', 'Device attribute (can be used multiple times)', collectAttributes, {})
    .action(async (options) => {
        logger.setVerbose(options.verbose);

        printBanner();
        printConfig(options);

        const client = new DdiClient({
            baseUrl: options.url,
            tenant: options.tenant,
            controllerId: options.controllerId,
            username: options.username,
            password: options.password,
            gatewayToken: options.gatewayToken,
            targetToken: options.targetToken,
        });

        const deviceAttributes: Record<string, string> = {
            'device.type': 'simulator',
            'device.version': '1.0.0',
            'device.os': process.platform,
            ...options.attribute,
        };

        const simulator = new DeviceSimulator(client, {
            pollingInterval: parseInt(options.interval, 10),
            autoConfirm: options.autoConfirm,
            deviceAttributes,
        });

        setupGracefulShutdown([simulator]);

        try {
            await simulator.start();
        } catch (error) {
            logger.error('Failed to start simulator:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('register')
    .description('Register device via Management API and start simulation')
    .requiredOption('-u, --url <url>', 'DDI API URL (e.g., http://localhost:8081)')
    .requiredOption('--mgmt-url <url>', 'Management API URL (e.g., http://localhost:8080)')
    .requiredOption('-c, --controller-id <id>', 'Device controller ID to register')
    .option('-n, --name <name>', 'Device display name')
    .option('-t, --tenant <tenant>', 'Tenant ID', 'default')
    .requiredOption('--username <username>', 'Management API username')
    .requiredOption('--password <password>', 'Management API password')
    .option('-i, --interval <seconds>', 'Polling interval in seconds', '10')
    .option('--auto-confirm', 'Automatically confirm pending actions', true)
    .option('--no-auto-confirm', 'Disable auto-confirmation')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .action(async (options) => {
        logger.setVerbose(options.verbose);
        printBanner();

        const mgmtClient = new ManagementClient({
            baseUrl: options.mgmtUrl,
            username: options.username,
            password: options.password,
        });

        try {
            // Step 1: Register device via Management API
            logger.info(`Registering device: ${options.controllerId}`);
            const target = await mgmtClient.getOrCreateTarget(
                options.controllerId,
                options.name || options.controllerId,
                `Simulator device created at ${new Date().toISOString()}`
            );

            logger.success(`Device registered! Token: ${target.securityToken.substring(0, 8)}...`);

            // Step 2: Start DDI simulation with the obtained token
            const ddiClient = new DdiClient({
                baseUrl: options.url,
                tenant: options.tenant,
                controllerId: options.controllerId,
                targetToken: target.securityToken,
            });

            printConfig({
                url: options.url,
                tenant: options.tenant,
                controllerId: options.controllerId,
                interval: options.interval,
                autoConfirm: options.autoConfirm,
            });

            const simulator = new DeviceSimulator(ddiClient, {
                pollingInterval: parseInt(options.interval, 10),
                autoConfirm: options.autoConfirm,
            });

            setupGracefulShutdown([simulator]);
            await simulator.start();
        } catch (error) {
            logger.error('Registration failed:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('multi')
    .description('Run multiple device simulators concurrently')
    .requiredOption('-u, --url <url>', 'DDI API URL (e.g., http://localhost:8081)')
    .requiredOption('--mgmt-url <url>', 'Management API URL (e.g., http://localhost:8080)')
    .requiredOption('--prefix <prefix>', 'Device ID prefix (e.g., "device" creates device-001, device-002...)')
    .requiredOption('--count <count>', 'Number of devices to simulate')
    .option('-t, --tenant <tenant>', 'Tenant ID', 'default')
    .requiredOption('--username <username>', 'Management API username')
    .requiredOption('--password <password>', 'Management API password')
    .option('-i, --interval <seconds>', 'Polling interval in seconds', '10')
    .option('--auto-confirm', 'Automatically confirm pending actions', true)
    .option('--no-auto-confirm', 'Disable auto-confirmation')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .action(async (options) => {
        logger.setVerbose(options.verbose);
        printBanner();

        const count = parseInt(options.count, 10);
        if (isNaN(count) || count < 1) {
            logger.error('Invalid count. Must be a positive number.');
            process.exit(1);
        }

        const mgmtClient = new ManagementClient({
            baseUrl: options.mgmtUrl,
            username: options.username,
            password: options.password,
        });

        const simulators: DeviceSimulator[] = [];

        console.log(chalk.gray('━'.repeat(52)));
        console.log(chalk.white('📡 DDI Server:  ') + chalk.cyan(options.url));
        console.log(chalk.white('🏢 Mgmt Server: ') + chalk.cyan(options.mgmtUrl));
        console.log(chalk.white('🔧 Prefix:      ') + chalk.cyan(options.prefix));
        console.log(chalk.white('📊 Count:       ') + chalk.cyan(count));
        console.log(chalk.gray('━'.repeat(52)) + '\n');

        try {
            // Register all devices
            logger.info(`Registering ${count} devices...`);

            for (let i = 1; i <= count; i++) {
                const controllerId = `${options.prefix}-${String(i).padStart(3, '0')}`;

                try {
                    const target = await mgmtClient.getOrCreateTarget(
                        controllerId,
                        controllerId,
                        `Multi-simulator device ${i} of ${count}`
                    );

                    const ddiClient = new DdiClient({
                        baseUrl: options.url,
                        tenant: options.tenant,
                        controllerId,
                        targetToken: target.securityToken,
                    });

                    const simulator = new DeviceSimulator(ddiClient, {
                        pollingInterval: parseInt(options.interval, 10),
                        autoConfirm: options.autoConfirm,
                    });

                    simulators.push(simulator);
                    logger.success(`[${i}/${count}] ${controllerId} registered`);
                } catch (error) {
                    logger.error(`Failed to register ${controllerId}:`, error instanceof Error ? error.message : error);
                }
            }

            if (simulators.length === 0) {
                logger.error('No devices registered successfully');
                process.exit(1);
            }

            logger.info(`Starting ${simulators.length} simulators...`);
            setupGracefulShutdown(simulators);

            // Start all simulators
            await Promise.all(simulators.map(s => s.start()));

        } catch (error) {
            logger.error('Multi-simulation failed:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('poll')
    .description('Perform a single poll to check for pending actions')
    .requiredOption('-u, --url <url>', 'hawkBit server URL')
    .requiredOption('-c, --controller-id <id>', 'Device controller ID')
    .option('-t, --tenant <tenant>', 'Tenant ID', 'default')
    .option('--username <username>', 'Basic Auth username')
    .option('--password <password>', 'Basic Auth password')
    .option('--gateway-token <token>', 'Gateway token for authentication')
    .option('--target-token <token>', 'Target token for authentication')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .action(async (options) => {
        logger.setVerbose(options.verbose);

        const client = new DdiClient({
            baseUrl: options.url,
            tenant: options.tenant,
            controllerId: options.controllerId,
            username: options.username,
            password: options.password,
            gatewayToken: options.gatewayToken,
            targetToken: options.targetToken,
        });

        try {
            const response = await client.getControllerBase();

            console.log('\n' + chalk.bold('Controller Base Response:'));
            console.log(chalk.gray('─'.repeat(50)));

            if (response.config?.polling?.sleep) {
                console.log(chalk.cyan('Polling Interval:'), response.config.polling.sleep);
            }

            const links = response._links || {};
            console.log(chalk.cyan('\nAvailable Links:'));

            if (Object.keys(links).length === 0) {
                console.log(chalk.gray('  (none)'));
            } else {
                for (const [name, link] of Object.entries(links)) {
                    console.log(`  ${chalk.yellow(name)}: ${link.href}`);
                }
            }

            console.log(chalk.gray('─'.repeat(50)));
        } catch (error) {
            logger.error('Poll failed:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program
    .command('send-config')
    .description('Send device configuration data')
    .requiredOption('-u, --url <url>', 'hawkBit server URL')
    .requiredOption('-c, --controller-id <id>', 'Device controller ID')
    .option('-t, --tenant <tenant>', 'Tenant ID', 'default')
    .option('--username <username>', 'Basic Auth username')
    .option('--password <password>', 'Basic Auth password')
    .option('--gateway-token <token>', 'Gateway token for authentication')
    .option('--target-token <token>', 'Target token for authentication')
    .requiredOption('-a, --attribute <key=value>', 'Device attribute (can be used multiple times)', collectAttributes, {})
    .option('-m, --mode <mode>', 'Update mode: merge, replace, remove', 'merge')
    .action(async (options) => {
        const client = new DdiClient({
            baseUrl: options.url,
            tenant: options.tenant,
            controllerId: options.controllerId,
            username: options.username,
            password: options.password,
            gatewayToken: options.gatewayToken,
            targetToken: options.targetToken,
        });

        try {
            await client.putConfigData({
                mode: options.mode,
                data: options.attribute,
            });
            logger.success('Config data sent successfully');
        } catch (error) {
            logger.error('Failed to send config data:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

function collectAttributes(value: string, previous: Record<string, string>): Record<string, string> {
    const [key, val] = value.split('=');
    if (key && val) {
        previous[key] = val;
    }
    return previous;
}

function setupGracefulShutdown(simulators: DeviceSimulator[]): void {
    const shutdown = () => {
        console.log('\n');
        simulators.forEach(s => s.stop());
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

function printBanner(): void {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════╗
║       DDI Device Simulator                        ║
║       Eclipse hawkBit Compatible                  ║
╚═══════════════════════════════════════════════════╝
`));
}

function printConfig(options: {
    url: string;
    tenant: string;
    controllerId: string;
    interval: string;
    autoConfirm: boolean;
}): void {
    console.log(chalk.gray('━'.repeat(52)));
    console.log(chalk.white('📡 Server:     ') + chalk.cyan(options.url));
    console.log(chalk.white('🏢 Tenant:     ') + chalk.cyan(options.tenant));
    console.log(chalk.white('🔧 Controller: ') + chalk.cyan(options.controllerId));
    console.log(chalk.white('⏱️  Interval:   ') + chalk.cyan(`${options.interval}s`));
    console.log(chalk.white('✓  Auto-Confirm:') + chalk.cyan(options.autoConfirm ? ' Yes' : ' No'));
    console.log(chalk.gray('━'.repeat(52)) + '\n');
}

program.parse();

