/**
 * API Validation Utilities
 * 
 * Provides runtime validation for API responses using Zod schemas.
 */

import { z } from 'zod';

// ============================================================================
// Safe Parse Helper
// ============================================================================

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: z.ZodError;
}

/**
 * Safely validates data against a Zod schema without throwing.
 * Returns a result object with success status and parsed data or error.
 */
export const safeValidate = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
): ValidationResult<T> => {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return { success: false, error: result.error };
};

/**
 * Validates data and returns it if valid, otherwise returns the original data.
 * Logs validation errors to console in development.
 */
export const validateOrPassthrough = <T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    context?: string
): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
        if (import.meta.env.DEV) {
            console.warn(
                `[Validation Warning]${context ? ` ${context}:` : ''}`,
                result.error.issues
            );
        }
        // Return original data as-is (unsafe but allows backward compatibility)
        return data as T;
    }

    return result.data;
};

/**
 * Validates data and throws if invalid.
 * Use this for critical validations where failure should stop execution.
 */
export const validateOrThrow = <T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    errorMessage?: string
): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
        const message = errorMessage || 'Validation failed';
        console.error(`[Validation Error] ${message}:`, result.error.issues);
        throw new Error(`${message}: ${result.error.message}`);
    }

    return result.data;
};

// ============================================================================
// List Response Validator Factory
// ============================================================================

/**
 * Creates a validator for paginated list responses.
 */
export const createListResponseValidator = <T>(
    itemSchema: z.ZodSchema<T>
) => {
    const schema = z.object({
        content: z.array(itemSchema),
        total: z.number(),
        size: z.number(),
    });

    return (data: unknown) => validateOrPassthrough(schema, data, 'List Response');
};

// ============================================================================
// Form Validation Helpers
// ============================================================================

/**
 * Converts Zod errors to a format compatible with Ant Design Form.
 */
export const zodToFormErrors = (
    error: z.ZodError
): Record<string, string> => {
    const errors: Record<string, string> = {};

    for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) {
            errors[path] = issue.message;
        }
    }

    return errors;
};

/**
 * Creates an Ant Design form validator from a Zod schema field.
 */
export const createAntdValidator = <T>(
    schema: z.ZodSchema<T>
) => {
    return (_rule: unknown, value: unknown) => {
        const result = schema.safeParse(value);
        if (result.success) {
            return Promise.resolve();
        }
        return Promise.reject(new Error(result.error.issues[0]?.message || 'Validation failed'));
    };
};
