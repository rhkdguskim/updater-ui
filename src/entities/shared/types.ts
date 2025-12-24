/**
 * Shared Entity Types
 * 
 * Common types used across multiple entities.
 */

import { z } from 'zod';

// ============================================================================
// Pagination
// ============================================================================

export const PaginationSchema = z.object({
    offset: z.number().int().min(0).default(0),
    limit: z.number().int().min(1).max(500).default(50),
    total: z.number().int().min(0).optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
    content: T[];
    total: number;
    size: number;
}

// ============================================================================
// Audit Fields (common to all entities)
// ============================================================================

export const AuditFieldsSchema = z.object({
    createdBy: z.string().optional(),
    createdAt: z.number().optional(),
    lastModifiedBy: z.string().optional(),
    lastModifiedAt: z.number().optional(),
});

export type AuditFields = z.infer<typeof AuditFieldsSchema>;

// ============================================================================
// Links (HAL format)
// ============================================================================

export const LinkSchema = z.object({
    href: z.string().url().optional(),
}).passthrough();

export const LinksSchema = z.record(z.string(), LinkSchema).optional();

export type Links = z.infer<typeof LinksSchema>;

// ============================================================================
// Update Status Enum
// ============================================================================

export const UpdateStatusSchema = z.enum([
    'ERROR',
    'IN_SYNC',
    'PENDING',
    'REGISTERED',
    'UNKNOWN',
]);

export type UpdateStatus = z.infer<typeof UpdateStatusSchema>;

// ============================================================================
// Action Type Enum
// ============================================================================

export const ActionTypeSchema = z.enum([
    'soft',
    'forced',
    'timeforced',
    'downloadonly',
]);

export type ActionType = z.infer<typeof ActionTypeSchema>;

// ============================================================================
// Action Status Enum
// ============================================================================

export const ActionStatusSchema = z.enum([
    'finished',
    'error',
    'warning',
    'pending',
    'running',
    'canceled',
    'canceling',
    'scheduled',
    'waiting_for_confirmation',
    'wait_for_confirmation', // API sometimes returns this variant
]);

export type ActionStatus = z.infer<typeof ActionStatusSchema>;

// ============================================================================
// Distribution Assignment Options
// ============================================================================

export const MaintenanceWindowSchema = z.object({
    schedule: z.string().optional(),
    duration: z.string().optional(),
    timezone: z.string().optional(),
}).optional();

export type MaintenanceWindow = z.infer<typeof MaintenanceWindowSchema>;
