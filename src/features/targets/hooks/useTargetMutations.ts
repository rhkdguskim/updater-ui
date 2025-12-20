import { useCallback } from 'react';
import { message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    useUpdateTarget,
    useDeleteTarget,
    usePostAssignedDistributionSet,
    useActivateAutoConfirm,
    useDeactivateAutoConfirm,
    useCreateMetadata,
    useUpdateMetadata,
    useDeleteMetadata,
    useAssignTargetType,
    useUnassignTargetType,
    getGetTargetQueryKey,
    getGetMetadataQueryKey,
} from '@/api/generated/targets/targets';
import type { MgmtDistributionSetAssignment } from '@/api/generated/model';

/**
 * Custom hook that consolidates all mutation logic for the Target Detail page.
 * This reduces boilerplate in the component and centralizes success/error handling.
 */
export const useTargetMutations = (targetId: string | undefined) => {
    const { t } = useTranslation(['targets', 'common']);
    const queryClient = useQueryClient();

    // Helper to show error message
    const showError = useCallback(
        (error: unknown) => {
            message.error((error as Error).message || t('common:messages.error'));
        },
        [t]
    );

    // Update Target
    const updateTargetMutation = useUpdateTarget({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.updateSuccess'));
                queryClient.invalidateQueries({ queryKey: getGetTargetQueryKey(targetId) });
            },
            onError: showError,
        },
    });

    // Delete Target
    const deleteTargetMutation = useDeleteTarget({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.deleteSuccess'));
            },
            onError: (error) => {
                message.error((error as Error).message || t('messages.deleteFailed'));
            },
        },
    });

    // Assign Distribution Set
    const assignDSMutation = usePostAssignedDistributionSet({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.assignSuccess'));
                queryClient.invalidateQueries();
            },
            onError: showError,
        },
    });

    // Auto Confirm
    const activateAutoConfirmMutation = useActivateAutoConfirm({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.autoConfirmActivated'));
                queryClient.invalidateQueries();
            },
            onError: showError,
        },
    });

    const deactivateAutoConfirmMutation = useDeactivateAutoConfirm({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.autoConfirmDeactivated'));
                queryClient.invalidateQueries();
            },
            onError: showError,
        },
    });

    // Metadata Mutations
    const createMetadataMutation = useCreateMetadata({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.metadataCreateSuccess'));
                queryClient.invalidateQueries({ queryKey: getGetMetadataQueryKey(targetId) });
            },
            onError: showError,
        },
    });

    const updateMetadataMutation = useUpdateMetadata({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.metadataUpdateSuccess'));
                queryClient.invalidateQueries({ queryKey: getGetMetadataQueryKey(targetId) });
            },
            onError: showError,
        },
    });

    const deleteMetadataMutation = useDeleteMetadata({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.metadataDeleteSuccess'));
                queryClient.invalidateQueries({ queryKey: getGetMetadataQueryKey(targetId) });
            },
            onError: showError,
        },
    });

    // Target Type Mutations
    const assignTargetTypeMutation = useAssignTargetType({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.targetTypeAssigned'));
                queryClient.invalidateQueries({ queryKey: getGetTargetQueryKey(targetId) });
            },
            onError: showError,
        },
    });

    const unassignTargetTypeMutation = useUnassignTargetType({
        mutation: {
            onSuccess: () => {
                message.success(t('messages.targetTypeRemoved'));
                queryClient.invalidateQueries({ queryKey: getGetTargetQueryKey(targetId) });
            },
            onError: showError,
        },
    });

    // --- Action Handlers ---
    const updateTarget = useCallback(
        (values: { name?: string; description?: string }, currentName?: string) => {
            if (!targetId) return;
            updateTargetMutation.mutate({
                targetId,
                data: {
                    controllerId: targetId,
                    name: values.name || currentName || targetId,
                    description: values.description,
                },
            });
        },
        [targetId, updateTargetMutation]
    );

    const deleteTarget = useCallback(() => {
        if (!targetId) return;
        deleteTargetMutation.mutate({ targetId });
    }, [targetId, deleteTargetMutation]);

    const assignDistributionSet = useCallback(
        (dsId: number, type: MgmtDistributionSetAssignment['type']) => {
            if (!targetId) return;
            assignDSMutation.mutate({
                targetId,
                data: [{ id: dsId, type }],
            });
        },
        [targetId, assignDSMutation]
    );

    const activateAutoConfirm = useCallback(() => {
        if (!targetId) return;
        activateAutoConfirmMutation.mutate({ targetId, data: {} });
    }, [targetId, activateAutoConfirmMutation]);

    const deactivateAutoConfirm = useCallback(() => {
        if (!targetId) return;
        deactivateAutoConfirmMutation.mutate({ targetId });
    }, [targetId, deactivateAutoConfirmMutation]);

    const createMetadata = useCallback(
        (key: string, value: string) => {
            if (!targetId) return;
            createMetadataMutation.mutate({
                targetId,
                data: [{ key, value }],
            });
        },
        [targetId, createMetadataMutation]
    );

    const updateMetadata = useCallback(
        (metadataKey: string, value: string) => {
            if (!targetId) return;
            updateMetadataMutation.mutate({
                targetId,
                metadataKey,
                data: { value },
            });
        },
        [targetId, updateMetadataMutation]
    );

    const deleteMetadata = useCallback(
        (metadataKey: string) => {
            if (!targetId) return;
            deleteMetadataMutation.mutate({ targetId, metadataKey });
        },
        [targetId, deleteMetadataMutation]
    );

    const assignTargetType = useCallback(
        (targetTypeId: number) => {
            if (!targetId) return;
            assignTargetTypeMutation.mutate({
                targetId,
                data: { id: targetTypeId },
            });
        },
        [targetId, assignTargetTypeMutation]
    );

    const unassignTargetType = useCallback(() => {
        if (!targetId) return;
        unassignTargetTypeMutation.mutate({ targetId });
    }, [targetId, unassignTargetTypeMutation]);

    return {
        // Actions
        updateTarget,
        deleteTarget,
        assignDistributionSet,
        activateAutoConfirm,
        deactivateAutoConfirm,
        createMetadata,
        updateMetadata,
        deleteMetadata,
        assignTargetType,
        unassignTargetType,

        // Loading states
        isUpdating: updateTargetMutation.isPending,
        isDeleting: deleteTargetMutation.isPending,
        isAssigningDS: assignDSMutation.isPending,
        isActivatingAutoConfirm: activateAutoConfirmMutation.isPending,
        isDeactivatingAutoConfirm: deactivateAutoConfirmMutation.isPending,
        isCreatingMetadata: createMetadataMutation.isPending,
        isUpdatingMetadata: updateMetadataMutation.isPending,
        isDeletingMetadata: deleteMetadataMutation.isPending,
        isAssigningType: assignTargetTypeMutation.isPending,
        isUnassigningType: unassignTargetTypeMutation.isPending,
    };
};
