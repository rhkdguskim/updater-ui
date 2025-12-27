

// We'll use a functional approach or just pure functions. 
// Since we need translation, we might need a hook or pass the t function.
// For a pure utility, assuming the caller passes 't' or we return the key.
// Let's return the key and let the component translate, OR accept 't'.

// To keep it simple and consistent with usage (e.g. inside components), 
// we can export a hook or just helper functions. 
// Given the existing code uses `t`, let's make a helper that accepts `t`.

export type StatusType =
    | 'finished' | 'running' | 'paused' | 'ready' | 'creating'
    | 'starting' | 'error' | 'waiting_for_approval' | 'scheduled'
    | 'pending' | 'retrieving' | 'retrieved' | 'downloading'
    | 'active' | 'completed' | 'canceled' | 'failed'
    | 'wait_for_confirmation' | 'waiting_for_confirmation' | 'canceling' | 'timeout';

export const getStatusColor = (status?: string): string => {
    if (!status) return 'default';
    switch (status.toLowerCase()) {
        case 'finished':
        case 'completed':
        case 'success':
            return 'success';
        case 'running':
        case 'active':
        case 'retrieving':
        case 'retrieved':
        case 'downloading':
        case 'processing':
        case 'canceling':
            return 'processing';
        case 'paused':
        case 'warning':
        case 'timeout':
        case 'wait_for_confirmation':
        case 'waiting_for_confirmation':
            return 'warning';
        case 'ready':
            return 'cyan';
        case 'creating':
        case 'scheduled':
        case 'pending':
            return 'default';
        case 'starting':
            return 'blue';
        case 'error':
        case 'failed':
        case 'canceled':
            return 'error';
        case 'waiting_for_approval':
            return 'purple';
        default:
            return 'default';
    }
};

/**
 * Standard interface for HawkBit translation options
 */
interface StatusLabelOptions {
    defaultValue?: string;
    [key: string]: string | number | boolean | undefined;
}

export const getStatusLabel = (
    status: string | undefined,
    t: (key: string, options?: StatusLabelOptions) => string
): string => {
    if (!status) return t('common:status.unknown', { defaultValue: 'UNKNOWN' });
    const key = status.toLowerCase();
    return t(`common:status.${key}`, { defaultValue: status.replace(/_/g, ' ').toUpperCase() });
};

