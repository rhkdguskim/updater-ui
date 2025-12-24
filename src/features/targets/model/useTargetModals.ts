/**
 * Target List Modal State Hook
 * 
 * Manages modal visibility and selected items for the target list.
 */

import { useState, useCallback } from 'react';
import type { MgmtTarget } from '@/api/generated/model';

export interface TargetModals {
    deleteModal: {
        open: boolean;
        target: MgmtTarget | null;
    };
    formModal: {
        open: boolean;
    };
    assignModal: {
        open: boolean;
        target: MgmtTarget | null;
    };
    bulkTagsModal: {
        open: boolean;
    };
    bulkTypeModal: {
        open: boolean;
    };
    bulkDeleteModal: {
        open: boolean;
    };
    savedFiltersModal: {
        open: boolean;
    };
}

export interface UseTargetModalsReturn {
    modals: TargetModals;

    // Delete Modal
    openDeleteModal: (target: MgmtTarget) => void;
    closeDeleteModal: () => void;

    // Form Modal (Create)
    openFormModal: () => void;
    closeFormModal: () => void;

    // Assign Modal
    openAssignModal: (target: MgmtTarget) => void;
    closeAssignModal: () => void;

    // Bulk Modals
    openBulkTagsModal: () => void;
    closeBulkTagsModal: () => void;
    openBulkTypeModal: () => void;
    closeBulkTypeModal: () => void;
    openBulkDeleteModal: () => void;
    closeBulkDeleteModal: () => void;

    // Saved Filters
    openSavedFiltersModal: () => void;
    closeSavedFiltersModal: () => void;
}

export const useTargetModals = (): UseTargetModalsReturn => {
    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [targetToDelete, setTargetToDelete] = useState<MgmtTarget | null>(null);

    // Form Modal
    const [formModalOpen, setFormModalOpen] = useState(false);

    // Assign Modal
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [targetToAssign, setTargetToAssign] = useState<MgmtTarget | null>(null);

    // Bulk Modals
    const [bulkTagsModalOpen, setBulkTagsModalOpen] = useState(false);
    const [bulkTypeModalOpen, setBulkTypeModalOpen] = useState(false);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

    // Saved Filters Modal
    const [savedFiltersOpen, setSavedFiltersOpen] = useState(false);

    // Delete Modal handlers
    const openDeleteModal = useCallback((target: MgmtTarget) => {
        setTargetToDelete(target);
        setDeleteModalOpen(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setDeleteModalOpen(false);
        setTargetToDelete(null);
    }, []);

    // Form Modal handlers
    const openFormModal = useCallback(() => setFormModalOpen(true), []);
    const closeFormModal = useCallback(() => setFormModalOpen(false), []);

    // Assign Modal handlers
    const openAssignModal = useCallback((target: MgmtTarget) => {
        setTargetToAssign(target);
        setAssignModalOpen(true);
    }, []);

    const closeAssignModal = useCallback(() => {
        setAssignModalOpen(false);
        setTargetToAssign(null);
    }, []);

    // Bulk Modal handlers
    const openBulkTagsModal = useCallback(() => setBulkTagsModalOpen(true), []);
    const closeBulkTagsModal = useCallback(() => setBulkTagsModalOpen(false), []);
    const openBulkTypeModal = useCallback(() => setBulkTypeModalOpen(true), []);
    const closeBulkTypeModal = useCallback(() => setBulkTypeModalOpen(false), []);
    const openBulkDeleteModal = useCallback(() => setBulkDeleteModalOpen(true), []);
    const closeBulkDeleteModal = useCallback(() => setBulkDeleteModalOpen(false), []);

    // Saved Filters handlers
    const openSavedFiltersModal = useCallback(() => setSavedFiltersOpen(true), []);
    const closeSavedFiltersModal = useCallback(() => setSavedFiltersOpen(false), []);

    return {
        modals: {
            deleteModal: { open: deleteModalOpen, target: targetToDelete },
            formModal: { open: formModalOpen },
            assignModal: { open: assignModalOpen, target: targetToAssign },
            bulkTagsModal: { open: bulkTagsModalOpen },
            bulkTypeModal: { open: bulkTypeModalOpen },
            bulkDeleteModal: { open: bulkDeleteModalOpen },
            savedFiltersModal: { open: savedFiltersOpen },
        },
        openDeleteModal,
        closeDeleteModal,
        openFormModal,
        closeFormModal,
        openAssignModal,
        closeAssignModal,
        openBulkTagsModal,
        closeBulkTagsModal,
        openBulkTypeModal,
        closeBulkTypeModal,
        openBulkDeleteModal,
        closeBulkDeleteModal,
        openSavedFiltersModal,
        closeSavedFiltersModal,
    };
};
