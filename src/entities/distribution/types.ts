/**
 * Distribution Entity
 * 
 * Domain model and Zod validation for Distribution Set entity.
 */

import { z } from 'zod';
import { AuditFieldsSchema, LinksSchema } from '../shared';

// ============================================================================
// Software Module Schema
// ============================================================================

export const SoftwareModuleSchema = z.object({
    id: z.number(),
    name: z.string(),
    version: z.string().optional(),
    type: z.string().optional(),
    typeName: z.string().optional(),
    vendor: z.string().optional(),
    description: z.string().optional(),
    deleted: z.boolean().optional(),
    encrypted: z.boolean().optional(),
    _links: LinksSchema,
});

export type SoftwareModule = z.infer<typeof SoftwareModuleSchema>;

// ============================================================================
// Distribution Set Schema
// ============================================================================

export const DistributionSetSchema = AuditFieldsSchema.extend({
    id: z.number(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    version: z.string().optional(),
    type: z.string().optional(),
    typeName: z.string().optional(),
    complete: z.boolean().optional(),
    locked: z.boolean().optional(),
    deleted: z.boolean().optional(),
    valid: z.boolean().optional(),
    requiredMigrationStep: z.boolean().optional(),
    modules: z.array(SoftwareModuleSchema).optional(),
    _links: LinksSchema,
});

export type DistributionSet = z.infer<typeof DistributionSetSchema>;

// ============================================================================
// Distribution Set List Response Schema
// ============================================================================

export const DistributionSetListResponseSchema = z.object({
    content: z.array(DistributionSetSchema),
    total: z.number(),
    size: z.number(),
});

export type DistributionSetListResponse = z.infer<typeof DistributionSetListResponseSchema>;

// ============================================================================
// Create Distribution Set Request Schema
// ============================================================================

export const CreateDistributionSetRequestSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(64, 'Name must be at most 64 characters'),
    version: z.string()
        .min(1, 'Version is required')
        .max(64, 'Version must be at most 64 characters'),
    description: z.string().max(512).optional(),
    type: z.string().optional(),
    requiredMigrationStep: z.boolean().optional(),
});

export type CreateDistributionSetRequest = z.infer<typeof CreateDistributionSetRequestSchema>;

// ============================================================================
// Assignment Request Schema
// ============================================================================

export const DistributionSetAssignmentSchema = z.object({
    id: z.number(),
    type: z.enum(['soft', 'forced', 'timeforced', 'downloadonly']).optional(),
    confirmationRequired: z.boolean().optional(),
    weight: z.number().min(0).max(1000).optional(),
    forcetime: z.number().optional(),
    maintenanceWindow: z.object({
        schedule: z.string(),
        duration: z.string(),
        timezone: z.string(),
    }).optional(),
});

export type DistributionSetAssignment = z.infer<typeof DistributionSetAssignmentSchema>;
