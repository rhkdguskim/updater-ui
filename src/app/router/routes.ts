/**
 * Route Configuration
 * 
 * Centralized route constants for the application.
 */

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',

    // Targets
    TARGETS: '/targets',
    TARGET_DETAIL: '/targets/:controllerId',

    // Distributions
    DISTRIBUTIONS: '/distributions',
    DISTRIBUTION_DETAIL: '/distributions/:id',

    // Actions
    ACTIONS: '/actions',
    ACTION_DETAIL: '/actions/:id',

    // Rollouts
    ROLLOUTS: '/rollouts',
    ROLLOUT_DETAIL: '/rollouts/:id',

    // Jobs
    JOBS: '/jobs',

    // System
    SYSTEM_CONFIG: '/system/config',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
