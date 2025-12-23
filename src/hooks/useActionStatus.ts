import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { axiosInstance } from '@/api/axios-instance';
import type { MgmtActionStatus } from '@/api/generated/model';

export const getActionStatus = async (actionId: number, signal?: AbortSignal) => {
    return axiosInstance<MgmtActionStatus>({
        url: `/rest/v1/actions/${actionId}/status`,
        method: 'GET',
        signal,
    });
};

export const useGetActionStatus = (
    actionId: number,
    options?: {
        query?: Partial<UseQueryOptions<MgmtActionStatus, Error>>;
    }
) => {
    const { query: queryOptions } = options ?? {};

    return useQuery<MgmtActionStatus, Error>({
        queryKey: [`/rest/v1/actions/${actionId}/status`],
        queryFn: ({ signal }) => getActionStatus(actionId, signal),
        enabled: !!actionId,
        ...queryOptions,
    });
};
