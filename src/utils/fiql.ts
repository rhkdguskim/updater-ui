/**
 * FIQL (Feed Item Query Language) Query Builder Utility
 *
 * hawkBit uses FIQL (also known as RSQL) for filtering.
 * This utility provides a standardized way to build FIQL queries.
 */

export type FiqlOperator = '==' | '!=' | '=lt=' | '=le=' | '=gt=' | '=ge=' | '=in=' | '=out=';

export interface FiqlCondition {
    field: string;
    operator: FiqlOperator;
    value: string | number | boolean | (string | number)[];
}

/**
 * Escapes special characters in FIQL values.
 */
const escapeValue = (value: string): string => {
    // Escape quotes and backslashes
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

/**
 * Formats a single value for FIQL query.
 */
const formatValue = (value: string | number | boolean): string => {
    if (typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'number') {
        return String(value);
    }
    // String values - check if it needs quotes
    const escaped = escapeValue(value);
    // If contains special characters or spaces, quote it
    if (/[\s,;()]/.test(escaped) || escaped.includes('*')) {
        return `"${escaped}"`;
    }
    return escaped;
};

/**
 * Builds a single FIQL condition string.
 *
 * @example
 * buildCondition({ field: 'name', operator: '==', value: '*test*' })
 * // Returns: 'name==*test*'
 */
export const buildCondition = (condition: FiqlCondition): string => {
    const { field, operator, value } = condition;

    if (Array.isArray(value)) {
        // For 'in' and 'out' operators
        const formattedValues = value.map(v => formatValue(v)).join(',');
        return `${field}${operator}(${formattedValues})`;
    }

    return `${field}${operator}${formatValue(value)}`;
};

/**
 * Builds a wildcard search query for a specific field.
 * This is the most common search pattern.
 *
 * @example
 * buildWildcardSearch('name', 'test')
 * // Returns: 'name==*test*'
 */
export const buildWildcardSearch = (field: string, value: string): string => {
    if (!value.trim()) return '';
    const trimmed = value.trim();
    return `${field}==*${trimmed}*`;
};

/**
 * Combines multiple FIQL conditions with AND (;) operator.
 *
 * @example
 * combineWithAnd(['name==*test*', 'status==online'])
 * // Returns: 'name==*test*;status==online'
 */
export const combineWithAnd = (conditions: string[]): string => {
    const validConditions = conditions.filter(c => c && c.trim());
    return validConditions.join(';');
};

/**
 * Combines multiple FIQL conditions with OR (,) operator.
 *
 * @example
 * combineWithOr(['status==online', 'status==pending'])
 * // Returns: 'status==online,status==pending'
 */
export const combineWithOr = (conditions: string[]): string => {
    const validConditions = conditions.filter(c => c && c.trim());
    return validConditions.join(',');
};

/**
 * Builds a complete FIQL query from a filter object.
 * Useful for building queries from form/filter state.
 *
 * @example
 * buildQueryFromFilters({ name: 'test', status: 'online' })
 * // Returns: 'name==*test*;status==online'
 */
export const buildQueryFromFilters = (
    filters: Record<string, string | undefined>,
    options: { wildcardFields?: string[] } = {}
): string => {
    const { wildcardFields = [] } = options;
    const conditions: string[] = [];

    Object.entries(filters).forEach(([field, value]) => {
        if (value && value.trim()) {
            if (wildcardFields.includes(field)) {
                conditions.push(buildWildcardSearch(field, value));
            } else {
                conditions.push(buildCondition({ field, operator: '==', value }));
            }
        }
    });

    return combineWithAnd(conditions);
};
