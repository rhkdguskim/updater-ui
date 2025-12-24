/**
 * Target Entity
 * 
 * Domain model and Zod validation for Target (Device) entity.
 */

import { z } from 'zod';
import { AuditFieldsSchema, LinksSchema, UpdateStatusSchema } from '../shared';

// ============================================================================
// Poll Status Schema
// ============================================================================

export const PollStatusSchema = z.object({
    lastRequestAt: z.number().optional(),
    nextExpectedRequestAt: z.number().optional(),
    overdue: z.boolean().optional(),
});

export type PollStatus = z.infer<typeof PollStatusSchema>;

// ============================================================================
// Target Schema
// ============================================================================

export const TargetSchema = AuditFieldsSchema.extend({
    controllerId: z.string().min(1, 'Controller ID is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    updateStatus: UpdateStatusSchema.optional(),
    lastControllerRequestAt: z.number().optional(),
    installedAt: z.number().optional(),
    ipAddress: z.string().optional(),
    address: z.string().optional(),
    pollStatus: PollStatusSchema.optional(),
    securityToken: z.string().optional(),
    requestAttributes: z.boolean().optional(),
    targetType: z.number().optional(),
    targetTypeName: z.string().optional(),
    autoConfirmActive: z.boolean().optional(),
    _links: LinksSchema,
});

export type Target = z.infer<typeof TargetSchema>;

// ============================================================================
// Target List Response Schema
// ============================================================================

export const TargetListResponseSchema = z.object({
    content: z.array(TargetSchema),
    total: z.number(),
    size: z.number(),
});

export type TargetListResponse = z.infer<typeof TargetListResponseSchema>;

// ============================================================================
// Create Target Request Schema
// ============================================================================

export const CreateTargetRequestSchema = z.object({
    controllerId: z.string()
        .min(1, 'Controller ID is required')
        .max(64, 'Controller ID must be at most 64 characters')
        .regex(/^[a-zA-Z0-9._-]+$/, 'Controller ID can only contain alphanumeric characters, dots, underscores, and hyphens'),
    name: z.string()
        .min(1, 'Name is required')
        .max(64, 'Name must be at most 64 characters'),
    description: z.string().max(512, 'Description must be at most 512 characters').optional(),
});

export type CreateTargetRequest = z.infer<typeof CreateTargetRequestSchema>;

// ============================================================================
// Target Update Request Schema
// ============================================================================

export const UpdateTargetRequestSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(64, 'Name must be at most 64 characters')
        .optional(),
    description: z.string().max(512, 'Description must be at most 512 characters').optional(),
    requestAttributes: z.boolean().optional(),
});

export type UpdateTargetRequest = z.infer<typeof UpdateTargetRequestSchema>;
