import { describe, it, expect } from 'vitest';
import {
    DistributionSetSchema,
    CreateDistributionSetRequestSchema,
    DistributionSetAssignmentSchema,
} from './types';
import {
    isComplete,
    isLocked,
    isValid,
    canAssign,
    getDisplayNameWithVersion,
    getModuleCount,
    groupByType,
    filterAssignable,
    countByCompleteness,
} from './model';
import type { DistributionSet } from './types';

describe('Distribution Entity', () => {
    describe('DistributionSetSchema validation', () => {
        it('should validate a valid distribution set', () => {
            const validDS = {
                id: 1,
                name: 'Test DS',
                version: '1.0.0',
                complete: true,
            };

            const result = DistributionSetSchema.safeParse(validDS);
            expect(result.success).toBe(true);
        });

        it('should reject distribution set without id', () => {
            const invalidDS = {
                name: 'Test DS',
            };

            const result = DistributionSetSchema.safeParse(invalidDS);
            expect(result.success).toBe(false);
        });

        it('should reject empty name', () => {
            const invalidDS = {
                id: 1,
                name: '',
            };

            const result = DistributionSetSchema.safeParse(invalidDS);
            expect(result.success).toBe(false);
        });
    });

    describe('CreateDistributionSetRequestSchema validation', () => {
        it('should validate a valid create request', () => {
            const request = {
                name: 'Test DS',
                version: '1.0.0',
                description: 'A test distribution set',
            };

            const result = CreateDistributionSetRequestSchema.safeParse(request);
            expect(result.success).toBe(true);
        });

        it('should reject missing version', () => {
            const request = {
                name: 'Test DS',
            };

            const result = CreateDistributionSetRequestSchema.safeParse(request);
            expect(result.success).toBe(false);
        });
    });

    describe('DistributionSetAssignmentSchema validation', () => {
        it('should validate valid assignment', () => {
            const assignment = {
                id: 1,
                type: 'forced',
                confirmationRequired: true,
                weight: 500,
            };

            const result = DistributionSetAssignmentSchema.safeParse(assignment);
            expect(result.success).toBe(true);
        });

        it('should reject invalid action type', () => {
            const assignment = {
                id: 1,
                type: 'invalid_type',
            };

            const result = DistributionSetAssignmentSchema.safeParse(assignment);
            expect(result.success).toBe(false);
        });

        it('should reject weight out of range', () => {
            const assignment = {
                id: 1,
                weight: 1500, // Max is 1000
            };

            const result = DistributionSetAssignmentSchema.safeParse(assignment);
            expect(result.success).toBe(false);
        });
    });

    describe('Model Functions', () => {
        const completeDS: DistributionSet = {
            id: 1,
            name: 'Complete DS',
            version: '1.0.0',
            complete: true,
            valid: true,
            locked: false,
        };

        const incompleteDS: DistributionSet = {
            id: 2,
            name: 'Incomplete DS',
            version: '0.1.0',
            complete: false,
            valid: true,
        };

        const invalidDS: DistributionSet = {
            id: 3,
            name: 'Invalid DS',
            version: '2.0.0',
            complete: true,
            valid: false,
        };

        const lockedDS: DistributionSet = {
            id: 4,
            name: 'Locked DS',
            version: '1.0.0',
            complete: true,
            locked: true,
        };

        const deletedDS: DistributionSet = {
            id: 5,
            name: 'Deleted DS',
            version: '1.0.0',
            complete: true,
            deleted: true,
        };

        describe('isComplete', () => {
            it('should return true for complete DS', () => {
                expect(isComplete(completeDS)).toBe(true);
            });

            it('should return false for incomplete DS', () => {
                expect(isComplete(incompleteDS)).toBe(false);
            });
        });

        describe('isLocked', () => {
            it('should return true for locked DS', () => {
                expect(isLocked(lockedDS)).toBe(true);
            });

            it('should return false for unlocked DS', () => {
                expect(isLocked(completeDS)).toBe(false);
            });
        });

        describe('isValid', () => {
            it('should return true for valid DS', () => {
                expect(isValid(completeDS)).toBe(true);
            });

            it('should return false for invalid DS', () => {
                expect(isValid(invalidDS)).toBe(false);
            });

            it('should return true when valid is undefined', () => {
                const ds: DistributionSet = { id: 1, name: 'Test' };
                expect(isValid(ds)).toBe(true);
            });
        });

        describe('canAssign', () => {
            it('should return true for complete and valid DS', () => {
                expect(canAssign(completeDS)).toBe(true);
            });

            it('should return false for incomplete DS', () => {
                expect(canAssign(incompleteDS)).toBe(false);
            });

            it('should return false for invalid DS', () => {
                expect(canAssign(invalidDS)).toBe(false);
            });

            it('should return false for deleted DS', () => {
                expect(canAssign(deletedDS)).toBe(false);
            });
        });

        describe('getDisplayNameWithVersion', () => {
            it('should return name with version', () => {
                expect(getDisplayNameWithVersion(completeDS)).toBe('Complete DS v1.0.0');
            });

            it('should return name only when no version', () => {
                const ds: DistributionSet = { id: 1, name: 'No Version' };
                expect(getDisplayNameWithVersion(ds)).toBe('No Version');
            });
        });

        describe('getModuleCount', () => {
            it('should return 0 for DS without modules', () => {
                expect(getModuleCount(completeDS)).toBe(0);
            });

            it('should return correct count for DS with modules', () => {
                const dsWithModules: DistributionSet = {
                    id: 1,
                    name: 'With Modules',
                    modules: [
                        { id: 1, name: 'Module 1' },
                        { id: 2, name: 'Module 2' },
                    ],
                };
                expect(getModuleCount(dsWithModules)).toBe(2);
            });
        });

        describe('groupByType', () => {
            it('should group distribution sets by type', () => {
                const sets: DistributionSet[] = [
                    { id: 1, name: 'DS1', typeName: 'os' },
                    { id: 2, name: 'DS2', typeName: 'app' },
                    { id: 3, name: 'DS3', typeName: 'os' },
                ];

                const groups = groupByType(sets);
                expect(groups['os'].length).toBe(2);
                expect(groups['app'].length).toBe(1);
            });

            it('should use Unknown for DS without type', () => {
                const sets: DistributionSet[] = [
                    { id: 1, name: 'DS1' },
                ];

                const groups = groupByType(sets);
                expect(groups['Unknown'].length).toBe(1);
            });
        });

        describe('filterAssignable', () => {
            it('should filter out non-assignable distribution sets', () => {
                const sets = [completeDS, incompleteDS, invalidDS, deletedDS];
                const assignable = filterAssignable(sets);

                expect(assignable.length).toBe(1);
                expect(assignable[0].id).toBe(completeDS.id);
            });
        });

        describe('countByCompleteness', () => {
            it('should count complete and incomplete sets', () => {
                const sets = [completeDS, incompleteDS, lockedDS];
                const counts = countByCompleteness(sets);

                expect(counts.complete).toBe(2);
                expect(counts.incomplete).toBe(1);
            });
        });
    });
});
