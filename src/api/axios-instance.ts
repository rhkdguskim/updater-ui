import axios, { type AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import i18n from '@/i18n';

export const AXIOS_INSTANCE = axios.create({
    baseURL: import.meta.env.API_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
});

declare module 'axios' {
    export interface AxiosRequestConfig {
        skipGlobalError?: boolean;
    }
}

export const axiosInstance = <T>(
    config: AxiosRequestConfig,
    options?: AxiosRequestConfig,
): Promise<T> => {
    const source = axios.CancelToken.source();
    const promise = AXIOS_INSTANCE({
        ...config,
        ...options,
        cancelToken: source.token,
    }).then(({ data }) => data);

    // @ts-ignore
    promise.cancel = () => {
        source.cancel('Query was cancelled');
    };

    return promise;
};

import { useAuthStore } from '@/stores/useAuthStore';

// Request Interceptor
AXIOS_INSTANCE.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Basic ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

AXIOS_INSTANCE.interceptors.response.use(
    (response) => response,
    (error) => {
        // Ignore cancelled requests
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }

        const { response } = error;

        if (response) {
            const { status, data } = response;

            // Handle Authentication Errors
            if (status === 401) {
                useAuthStore.getState().logout();
                message.error(i18n.t('common:apiErrors.UNAUTHORIZED_ACCESS'));
                return Promise.reject(error);
            }

            // Handle API Errors based on ExceptionInfo
            const errorCode = data?.errorCode;
            const errorMsg = data?.message;

            let displayMessage = '';

            if (errorCode) {
                // Normalize error code: hawkbit.server.error -> HAWKBIT_SERVER_ERROR
                const normalizedCode = errorCode.toUpperCase().replace(/\./g, '_');

                // 1. Try to translate normalized code
                const translationKey = `common:apiErrors.${normalizedCode}`;

                if (i18n.exists(translationKey)) {
                    displayMessage = i18n.t(translationKey);
                } else if (errorMsg) {
                    // 2. Fallback to server message
                    displayMessage = errorMsg;
                } else {
                    // 3. Last resort if we have an errorCode but no text
                    displayMessage = i18n.t('common:apiErrors.generic.unknown');
                }
            } else if (status) {
                // 3. Fallback to generic HTTP status messages
                const genericKey = `common:apiErrors.generic.${status}`;
                if (i18n.exists(genericKey)) {
                    displayMessage = i18n.t(genericKey);
                } else {
                    displayMessage = i18n.t('common:apiErrors.generic.unknown');
                }
            } else {
                displayMessage = i18n.t('common:apiErrors.generic.unknown');
            }

            // Avoid showing "undefined" or empty messages
            if (displayMessage) {
                // Overwrite the error message so downstream components display the localized text
                error.message = displayMessage;

                // Only show global error message if not explicitly skipped
                if (!error.config?.skipGlobalError) {
                    message.error(displayMessage);
                }
            }
        } else if (error.request) {
            // Network or Timeout errors
            const timeoutMsg = i18n.t('common:apiErrors.TIMEOUT');
            error.message = timeoutMsg;
            if (!error.config?.skipGlobalError) {
                message.error(timeoutMsg);
            }
        } else {
            const unknownMsg = i18n.t('common:apiErrors.generic.unknown');
            error.message = unknownMsg;
            if (!error.config?.skipGlobalError) {
                message.error(unknownMsg);
            }
        }

        return Promise.reject(error);
    }
);

