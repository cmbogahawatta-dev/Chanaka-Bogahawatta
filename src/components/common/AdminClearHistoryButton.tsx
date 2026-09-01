import React, { useState } from 'react';
import { Trash2, ShieldAlert } from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useFleet } from '../../context/FleetContext';
import { AdminClearHistoryModal } from './AdminClearHistoryModal';

export interface AdminClearHistoryButtonProps {
  id?: string;
  label?: string;
  buttonText?: string;
  moduleName: string;
  itemCount: number;
  itemDescription?: string;
  preservedItemsDescription?: string;
  onClear: () => void;
  variant?: 'danger' | 'ghost' | 'outline' | 'compact';
  className?: string;
  buttonClassName?: string;
}

export const AdminClearHistoryButton: React.FC<AdminClearHistoryButtonProps> = ({
  id = 'btn-admin-clear-history',
  label,
  buttonText,
  moduleName,
  itemCount,
  itemDescription,
  preservedItemsDescription,
  onClear,
  variant = 'outline',
  className = '',
  buttonClassName = ''
}) => {
  const displayLabel = label || buttonText || 'Clear History';
  const customClass = className || buttonClassName;
  const { currentRole } = useEnterprise();
  const { isAdmin } = useFleet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isRoleAdmin = currentRole === 'ADMIN' || isAdmin;

  // Only visible for Admin
  if (!isRoleAdmin) {
    return null;
  }

  let buttonStyles = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ';
  if (variant === 'danger') {
    buttonStyles += 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/30 ';
  } else if (variant === 'ghost') {
    buttonStyles += 'text-red-400 hover:text-red-300 hover:bg-red-500/10 ';
  } else if (variant === 'compact') {
    buttonStyles = 'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/40 ';
  } else {
    // outline
    buttonStyles += 'bg-slate-800/80 hover:bg-red-950/50 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 shadow-sm ';
  }

  return (
    <>
      <button
        id={id}
        onClick={() => setIsModalOpen(true)}
        disabled={itemCount === 0}
        title={itemCount === 0 ? 'No records to clear' : `Admin: Clear ${itemCount} ${moduleName} history records`}
        className={`${buttonStyles} disabled:opacity-40 disabled:cursor-not-allowed ${customClass}`}
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
        <span>{displayLabel}</span>
        <span className="ml-0.5 px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase bg-red-500/20 text-red-300 border border-red-500/40 rounded">
          Admin
        </span>
      </button>

      <AdminClearHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onClear}
        moduleName={moduleName}
        itemCount={itemCount}
        itemDescription={itemDescription}
        preservedItemsDescription={preservedItemsDescription}
      />
    </>
  );
};
