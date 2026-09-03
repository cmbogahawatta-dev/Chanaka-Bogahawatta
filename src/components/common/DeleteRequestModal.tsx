import React from 'react';
import { UniversalDeleteModal, UniversalDeleteModalProps } from './UniversalDeleteModal';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { useStaff } from '../../context/StaffContext';
import { useGeofence } from '../../context/GeofenceContext';
import { DataManagementModule } from '../../types/dataManagementTypes';

export interface DeleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: DataManagementModule;
  recordType: string;
  recordId: string;
  recordTitle: string;
  recordSummary?: Record<string, any>;
  onDirectDeleteSuccess?: () => void;
}

/**
 * Standardized Direct Admin Deletion Modal
 * Replaces the deprecated Delete Approval Queue with immediate Admin Authorization Key verification.
 */
export const DeleteRequestModal: React.FC<DeleteRequestModalProps> = ({
  isOpen,
  onClose,
  module,
  recordType,
  recordId,
  recordTitle,
  recordSummary,
  onDirectDeleteSuccess
}) => {
  const { deleteProject, deleteSupervisor, deleteCategory } = usePettyCash();
  const { deleteVehicle, deleteDriver } = useFleet();
  const { deleteStaffMember, updateStaffMember } = useStaff();
  const { deleteGeofence } = useGeofence();

  const handleDelete = () => {
    switch (module) {
      case 'PROJECTS':
        deleteProject(recordId);
        break;
      case 'SUPERVISORS':
        deleteSupervisor(recordId);
        break;
      case 'VEHICLES':
        deleteVehicle(recordId);
        break;
      case 'DRIVERS':
        deleteDriver(recordId);
        break;
      case 'STAFF':
        deleteStaffMember(recordId);
        break;
      case 'GEOFENCES':
        deleteGeofence(recordId);
        break;
      case 'EXPENSES':
      case 'CATEGORIES' as any:
      case 'EXPENSE_CATEGORIES' as any:
        deleteCategory(recordId);
        break;
      default:
        break;
    }
    if (onDirectDeleteSuccess) onDirectDeleteSuccess();
  };

  const handleDeactivate = () => {
    if (module === 'STAFF') {
      updateStaffMember(recordId, { status: 'Resigned' });
    }
    if (onDirectDeleteSuccess) onDirectDeleteSuccess();
  };

  return (
    <UniversalDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      module={module}
      recordType={recordType}
      recordId={recordId}
      recordTitle={recordTitle}
      recordSummary={recordSummary}
      onDelete={handleDelete}
      onDeactivate={module === 'STAFF' ? handleDeactivate : undefined}
      onSuccess={onDirectDeleteSuccess}
    />
  );
};
