/**
 * Action Entity Types
 */

import { z } from 'zod';
import { AuditFieldsSchema, LinksSchema, ActionStatusSchema, ActionTypeSchema } from '../shared';

export const ActionSchema = AuditFieldsSchema.extend({
    id: z.number().int(),
    status: ActionStatusSchema.optional(),
    detailStatus: z.string().optional(),
    actionType: ActionTypeSchema.optional(),
    forced: z.boolean().optional(),
    weight: z.number().optional(),
    confirmationRequired: z.boolean().optional(),
    lastStatusCode: z.number().optional(),
    _links: LinksSchema,
});

export type Action = z.infer<typeof ActionSchema>;

export const ActionListResponseSchema = z.object({
    content: z.array(ActionSchema),
    total: z.number(),
    size: z.number(),
});

export type ActionListResponse = z.infer<typeof ActionListResponseSchema>;
