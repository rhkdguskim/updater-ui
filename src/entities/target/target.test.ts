import { describe, it, expect } from 'vitest';
import {
    TargetSchema,
    CreateTargetRequestSchema,
} from './types';
import {
    isTargetOnline,
    getConnectivityStatus,
    needsUpdate,
    isInSync,
    hasError,
    getNormalizedUpdateStatus,
    getTargetDisplayName,
    getTimeSinceLastRequest,
    groupByUpdateStatus,
    countByConnectivity,
} from './model';
import type { Target } from './types';

describe('Target Entity', () => {
    describe('TargetSchema validation', () => {
        it('should validate a valid target', () => {
            const validTarget = {
                controllerId: 'device-001',
                name: 'Test Device',
                updateStatus: 'IN_SYNC',
            };

            const result = TargetSchema.safeParse(validTarget);
            expect(result.success).toBe(true);
        });

        it('should reject target without controllerId', () => {
            const invalidTarget = {
                name: 'Test Device',
            };

            const result = TargetSchema.safeParse(invalidTarget);
            expect(result.success).toBe(false);
        });

        it('should allow optional fields to be undefined', () => {
            const minimalTarget = {
                controllerId: 'device-001',
                name: 'Test',
            };

            const result = TargetSchema.safeParse(minimalTarget);
            expect(result.success).toBe(true);
        });
    });

    describe('CreateTargetRequestSchema validation', () => {
        it('should validate a valid create request', () => {
            const request = {
                controllerId: 'device-001',
                name: 'Test Device',
                description: 'A test device',
            };

            const result = CreateTargetRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        });

        it('should reject invalid controllerId format', () => {
            const request = {
                controllerId: 'invalid device!@#',
                name: 'Test',
            };

            const result = CreateTargetRequestSchema.safeParse(request);
            expect(result.success).toBe(false);
        });

        it('should reject empty controllerId', () => {
            const request = {
                controllerId: '',
                name: 'Test',
            };

            const result = CreateTargetRequestSchema.safeParse(request);
            expect(result.success).toBe(false);
        });
    });

    describe('Model Functions', () => {
        const onlineTarget: Target = {
            controllerId: 'online-device',
            name: 'Online Device',
            updateStatus: 'IN_SYNC',
            pollStatus: { overdue: false },
        };

        const offlineTarget: Target = {
            controllerId: 'offline-device',
            name: 'Offline Device',
            updateStatus: 'PENDING',
            pollStatus: { overdue: true },
        };

        const noPollTarget: Target = {
            controllerId: 'no-poll-device',
            name: 'No Poll Device',
        };

        describe('isTargetOnline', () => {
            it('should return true for non-overdue target', () => {
                expect(isTargetOnline(onlineTarget)).toBe(true);
            });

            it('should return false for overdue target', () => {
                expect(isTargetOnline(offlineTarget)).toBe(false);
            });

            it('should return false for target without poll status', () => {
                expect(isTargetOnline(noPollTarget)).toBe(false);
            });
        });

        describe('getConnectivityStatus', () => {
            it('should return online for non-overdue', () => {
                expect(getConnectivityStatus(onlineTarget)).toBe('online');
            });

            it('should return offline for overdue', () => {
                expect(getConnectivityStatus(offlineTarget)).toBe('offline');
            });

            it('should return unknown for no poll status', () => {
                expect(getConnectivityStatus(noPollTarget)).toBe('unknown');
            });
        });

        describe('Update status helpers', () => {
            it('needsUpdate should return true for PENDING', () => {
                expect(needsUpdate(offlineTarget)).toBe(true);
            });

            it('needsUpdate should return false for IN_SYNC', () => {
                expect(needsUpdate(onlineTarget)).toBe(false);
            });

            it('isInSync should return true for IN_SYNC', () => {
                expect(isInSync(onlineTarget)).toBe(true);
            });

            it('hasError should return true for ERROR status', () => {
                const errorTarget: Target = {
                    controllerId: 'error-device',
                    name: 'Error Device',
                    updateStatus: 'ERROR',
                };
                expect(hasError(errorTarget)).toBe(true);
            });
        });

        describe('getNormalizedUpdateStatus', () => {
            it('should return the status as-is for valid statuses', () => {
                expect(getNormalizedUpdateStatus(onlineTarget)).toBe('IN_SYNC');
                expect(getNormalizedUpdateStatus(offlineTarget)).toBe('PENDING');
            });

            it('should return UNKNOWN for undefined status', () => {
                expect(getNormalizedUpdateStatus(noPollTarget)).toBe('UNKNOWN');
            });
        });

        describe('getTargetDisplayName', () => {
            it('should return name if present', () => {
                expect(getTargetDisplayName(onlineTarget)).toBe('Online Device');
            });

            it('should return controllerId if name is empty', () => {
                const target: Target = { controllerId: 'test-id', name: '' };
                expect(getTargetDisplayName(target)).toBe('test-id');
            });
        });

        describe('getTimeSinceLastRequest', () => {
            it('should return null for no last request time', () => {
                expect(getTimeSinceLastRequest(noPollTarget)).toBeNull();
            });

            it('should return "Just now" for recent request', () => {
                const recentTarget: Target = {
                    controllerId: 'recent',
                    name: 'Recent',
                    lastControllerRequestAt: Date.now() - 10000, // 10 seconds ago
                };
                expect(getTimeSinceLastRequest(recentTarget)).toBe('Just now');
            });
        });

        describe('groupByUpdateStatus', () => {
            it('should group targets by their update status', () => {
                const targets = [onlineTarget, offlineTarget, noPollTarget];
                const groups = groupByUpdateStatus(targets);

                expect(groups.IN_SYNC.length).toBe(1);
                expect(groups.PENDING.length).toBe(1);
                expect(groups.UNKNOWN.length).toBe(1);
            });
        });

        describe('countByConnectivity', () => {
            it('should count targets by connectivity', () => {
                const targets = [onlineTarget, offlineTarget, noPollTarget];
                const counts = countByConnectivity(targets);

                expect(counts.online).toBe(1);
                expect(counts.offline).toBe(1);
                expect(counts.unknown).toBe(1);
            });
        });
    });
});
