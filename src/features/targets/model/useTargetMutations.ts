/**
 * Target Mutations Hook
 * 
 * Centralizes all target-related mutations with standardized error handling.
 */

import { useCallback } from 'react';
import { message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    useDeleteTarget,
    useCreateTargets,
    usePostAssignedDistributionSet,
    getGetTargetsQueryKey,
} from '@/api/generated/targets/targets';
import type {
    MgmtDistributionSetAssignment,
    MgmtDistributionSetAssignments
} from '@/api/generated/model';

export interface CreateTargetInput {
    controllerId: string;
    name?: string;
    description?: string;
}

export interface AssignDSInput {
    targetId: string;
    dsId: number;
    type?: 'soft' | 'forced' | 'timeforced' | 'downloadonly';
    confirmationRequired?: boolean;
    weight?: number;
    forcetime?: number;
    maintenanceWindow?: {
        schedule: string;
        duration: string;
        timezone: string;
    };
}

export interface UseTargetMutationsReturn {
    // Delete
    deleteTarget: (controllerId: string) => void;
    isDeleting: boolean;

    // Create
    createTarget: (input: CreateTargetInput) => void;
    isCreating: boolean;

    // Assign Distribution Set
    assignDistributionSet: (input: AssignDSInput) => void;
    isAssigning: boolean;
}

export interface UseTargetMutationsOptions {
    onDeleteSuccess?: () => void;
    onCreateSuccess?: () => void;
    onAssignSuccess?: () => void;
}

export const useTargetMutations = (
    options: UseTargetMutationsOptions = {}
): UseTargetMutationsReturn => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('targets');

    const invalidateTargets = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: getGetTargetsQueryKey() });
    }, [queryClient]);

    // Delete mutation
    const deleteTargetMutation = useDeleteTarget({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.deleteSuccess'));
                invalidateTargets();
                options.onDeleteSuccess?.();
            },
            onError: (error) => {
                const errMsg = (error as Error).message || t('messages.deleteFailed');
                if (errMsg.includes('409')) {
                    message.error(t('messages.conflict', { ns: 'common' }));
                } else {
                    message.error(errMsg);
                }
            },
        },
    });

    // Create mutation
    const createTargetMutation = useCreateTargets({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.createSuccess'));
                invalidateTargets();
                options.onCreateSuccess?.();
            },
            onError: (error) => {
                const errMsg = (error as Error).message || t('messages.createFailed');
                if (errMsg.includes('409')) {
                    message.error(t('messages.targetExists'));
                } else {
                    message.error(errMsg);
                }
            },
        },
    });

    // Assign distribution set mutation
    const assignDSMutation = usePostAssignedDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.assignSuccess'));
                invalidateTargets();
                options.onAssignSuccess?.();
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.error', { ns: 'common' }));
            },
        },
    });

    // Wrapped handlers
    const deleteTarget = useCallback((controllerId: string) => {
        deleteTargetMutation.mutate({ targetId: controllerId });
    }, [deleteTargetMutation]);

    const createTarget = useCallback((input: CreateTargetInput) => {
        createTargetMutation.mutate({
            data: [{
                controllerId: input.controllerId,
                name: input.name || input.controllerId,
                description: input.description,
            }],
        });
    }, [createTargetMutation]);

    const assignDistributionSet = useCallback((input: AssignDSInput) => {
        const assignment: MgmtDistributionSetAssignment = {
            id: input.dsId,
            type: input.type as MgmtDistributionSetAssignment['type'],
            confirmationRequired: input.confirmationRequired,
            weight: input.weight,
            forcetime: input.forcetime,
            maintenanceWindow: input.maintenanceWindow,
        };

        assignDSMutation.mutate({
            targetId: input.targetId,
            data: [assignment] as MgmtDistributionSetAssignments,
        });
    }, [assignDSMutation]);

    return {
        deleteTarget,
        isDeleting: deleteTargetMutation.isPending,
        createTarget,
        isCreating: createTargetMutation.isPending,
        assignDistributionSet,
        isAssigning: assignDSMutation.isPending,
    };
};
