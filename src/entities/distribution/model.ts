/**
 * Distribution Entity Model
 * 
 * Pure functions for Distribution domain logic.
 */

import type { DistributionSet, SoftwareModule } from './types';

// ============================================================================
// Status Helpers
// ============================================================================

/**
 * Checks if a distribution set is complete (all required modules assigned).
 */
export const isComplete = (ds: DistributionSet): boolean => {
    return ds.complete === true;
};

/**
 * Checks if a distribution set is locked.
 */
export const isLocked = (ds: DistributionSet): boolean => {
    return ds.locked === true;
};

/**
 * Checks if a distribution set is valid (not invalidated).
 */
export const isValid = (ds: DistributionSet): boolean => {
    return ds.valid !== false; // Default to true if undefined
};

/**
 * Checks if a distribution set can be assigned to targets.
 */
export const canAssign = (ds: DistributionSet): boolean => {
    return isComplete(ds) && isValid(ds) && !ds.deleted;
};

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Gets the full display name with version.
 */
export const getDisplayNameWithVersion = (ds: DistributionSet): string => {
    if (ds.version) {
        return `${ds.name} v${ds.version}`;
    }
    return ds.name;
};

/**
 * Gets the short display identifier.
 */
export const getShortId = (ds: DistributionSet): string => {
    return `DS-${ds.id}`;
};

// ============================================================================
// Module Helpers
// ============================================================================

/**
 * Gets the count of modules in a distribution set.
 */
export const getModuleCount = (ds: DistributionSet): number => {
    return ds.modules?.length ?? 0;
};

/**
 * Gets modules filtered by type.
 */
export const getModulesByType = (ds: DistributionSet, type: string): SoftwareModule[] => {
    return ds.modules?.filter(m => m.type === type || m.typeName === type) ?? [];
};

/**
 * Calculates total size of all modules (if available).
 */
export const getTotalModulesInfo = (ds: DistributionSet): string => {
    const count = getModuleCount(ds);
    if (count === 0) return 'No modules';
    return `${count} module${count > 1 ? 's' : ''}`;
};

// ============================================================================
// Grouping Utilities
// ============================================================================

/**
 * Groups distribution sets by type.
 */
export const groupByType = (sets: DistributionSet[]): Record<string, DistributionSet[]> => {
    const groups: Record<string, DistributionSet[]> = {};

    for (const ds of sets) {
        const typeName = ds.typeName || ds.type || 'Unknown';
        if (!groups[typeName]) {
            groups[typeName] = [];
        }
        groups[typeName].push(ds);
    }

    return groups;
};

/**
 * Filters distribution sets that are valid for assignment.
 */
export const filterAssignable = (sets: DistributionSet[]): DistributionSet[] => {
    return sets.filter(canAssign);
};

/**
 * Counts distribution sets by completeness.
 */
export const countByCompleteness = (sets: DistributionSet[]): { complete: number; incomplete: number } => {
    return sets.reduce(
        (acc, ds) => {
            if (isComplete(ds)) {
                acc.complete++;
            } else {
                acc.incomplete++;
            }
            return acc;
        },
        { complete: 0, incomplete: 0 }
    );
};
