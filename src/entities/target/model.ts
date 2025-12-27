/**
 * Target Entity Model
 * 
 * Pure functions for Target domain logic (calculations, transformations, predicates).
 */

import type { Target } from './types';
import type { UpdateStatus } from '../shared';

// ============================================================================
// Connectivity Status
// ============================================================================

/**
 * Determines if a target is currently online based on its poll status.
 * A target is considered online if it polled within the expected interval.
 */
export const isTargetOnline = (target: Target): boolean => {
    if (!target.pollStatus) return false;
    return target.pollStatus.overdue === false && !isOverdueByExpectedTime(target.pollStatus);
};

/**
 * Checks if target is overdue based on nextExpectedRequestAt.
 */
export const isOverdueByExpectedTime = (pollStatus?: { nextExpectedRequestAt?: number }): boolean => {
    if (!pollStatus?.nextExpectedRequestAt) return false;
    return Date.now() > pollStatus.nextExpectedRequestAt;
};

/**
 * Gets the connectivity status label for display.
 */
export const getConnectivityStatus = (target: Target): 'online' | 'offline' | 'unknown' => {
    if (!target.pollStatus) return 'unknown';
    return target.pollStatus.overdue === false ? 'online' : 'offline';
};

// ============================================================================
// Update Status Helpers
// ============================================================================

/**
 * Checks if target needs an update.
 */
export const needsUpdate = (target: Target): boolean => {
    const status = target.updateStatus as UpdateStatus | undefined;
    return status === 'PENDING' || status === 'ERROR';
};

/**
 * Checks if target is in sync (up to date).
 */
export const isInSync = (target: Target): boolean => {
    return target.updateStatus === 'IN_SYNC';
};

/**
 * Checks if target has an error status.
 */
export const hasError = (target: Target): boolean => {
    return target.updateStatus === 'ERROR';
};

/**
 * Gets a normalized update status for grouping.
 */
export const getNormalizedUpdateStatus = (target: Target): UpdateStatus => {
    const status = target.updateStatus;
    if (!status) return 'UNKNOWN';

    const validStatuses: UpdateStatus[] = ['ERROR', 'IN_SYNC', 'PENDING', 'REGISTERED', 'UNKNOWN'];
    return validStatuses.includes(status as UpdateStatus)
        ? (status as UpdateStatus)
        : 'UNKNOWN';
};

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Gets the display name for a target (name or controllerId).
 */
export const getTargetDisplayName = (target: Target): string => {
    return target.name || target.controllerId;
};

/**
 * Formats the last seen time for display.
 */
export const formatLastSeen = (target: Target): string | null => {
    if (!target.lastControllerRequestAt) return null;

    const date = new Date(target.lastControllerRequestAt);
    return date.toLocaleString();
};

/**
 * Gets time since last controller request in human readable format.
 */
export const getTimeSinceLastRequest = (target: Target): string | null => {
    if (!target.lastControllerRequestAt) return null;

    const now = Date.now();
    const diff = now - target.lastControllerRequestAt;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
};

// ============================================================================
// Grouping Utilities
// ============================================================================

/**
 * Groups targets by their update status.
 */
export const groupByUpdateStatus = (targets: Target[]): Record<UpdateStatus, Target[]> => {
    const groups: Record<UpdateStatus, Target[]> = {
        ERROR: [],
        IN_SYNC: [],
        PENDING: [],
        REGISTERED: [],
        UNKNOWN: [],
    };

    for (const target of targets) {
        const status = getNormalizedUpdateStatus(target);
        groups[status].push(target);
    }

    return groups;
};

/**
 * Groups targets by their target type.
 */
export const groupByTargetType = (targets: Target[]): Record<string, Target[]> => {
    const groups: Record<string, Target[]> = {};

    for (const target of targets) {
        const typeName = target.targetTypeName || 'Unassigned';
        if (!groups[typeName]) {
            groups[typeName] = [];
        }
        groups[typeName].push(target);
    }

    return groups;
};

/**
 * Counts targets by connectivity status.
 */
export const countByConnectivity = (targets: Target[]): { online: number; offline: number; unknown: number } => {
    return targets.reduce(
        (acc, target) => {
            const status = getConnectivityStatus(target);
            acc[status]++;
            return acc;
        },
        { online: 0, offline: 0, unknown: 0 }
    );
};
