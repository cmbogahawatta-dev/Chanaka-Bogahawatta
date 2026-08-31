import { ServiceSchedule, ServiceStatus, Vehicle } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0
  }).format(amount).replace('LKR', 'Rs.');
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateStr: string, timeStr?: string): string {
  if (!dateStr) return 'N/A';
  const formattedDate = formatDate(dateStr);
  return timeStr ? `${formattedDate} at ${timeStr}` : formattedDate;
}

export function getDaysDifference(targetDateStr: string, fromDateStr = new Date().toISOString().split('T')[0]): number {
  const target = new Date(targetDateStr).getTime();
  const from = new Date(fromDateStr).getTime();
  const diffTime = target - from;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateServiceStatus(
  schedule: ServiceSchedule,
  vehicleCurrentOdo: number,
  todayStr = new Date().toISOString().split('T')[0]
): {
  status: ServiceStatus;
  kmRemaining: number;
  daysRemaining: number;
  reason: string;
} {
  const kmRemaining = schedule.nextDueOdometerKm - vehicleCurrentOdo;
  const daysRemaining = getDaysDifference(schedule.nextDueDate, todayStr);

  const isOdoOverdue = kmRemaining <= 0;
  const isDateOverdue = daysRemaining <= 0;

  if (isOdoOverdue || isDateOverdue) {
    const reasonParts: string[] = [];
    if (isOdoOverdue) reasonParts.push(`${Math.abs(kmRemaining).toLocaleString()} km overdue`);
    if (isDateOverdue) reasonParts.push(`${Math.abs(daysRemaining)} days past due`);
    return {
      status: 'overdue',
      kmRemaining,
      daysRemaining,
      reason: reasonParts.join(' & ')
    };
  }

  const isOdoDueSoon = kmRemaining <= 500;
  const isDateDueSoon = daysRemaining <= 14;

  if (isOdoDueSoon || isDateDueSoon) {
    const reasonParts: string[] = [];
    if (isOdoDueSoon) reasonParts.push(`Due in ${kmRemaining} km`);
    if (isDateDueSoon) reasonParts.push(`Due in ${daysRemaining} days`);
    return {
      status: 'due-soon',
      kmRemaining,
      daysRemaining,
      reason: reasonParts.join(' / ')
    };
  }

  return {
    status: 'good',
    kmRemaining,
    daysRemaining,
    reason: `In ${kmRemaining.toLocaleString()} km or ${daysRemaining} days`
  };
}

export function isDriverLicenseExpiringSoon(expiryDate: string, daysThreshold = 30): { isExpiring: boolean; isExpired: boolean; daysLeft: number } {
  if (!expiryDate) return { isExpiring: false, isExpired: false, daysLeft: 999 };
  const daysLeft = getDaysDifference(expiryDate);
  return {
    isExpired: daysLeft <= 0,
    isExpiring: daysLeft > 0 && daysLeft <= daysThreshold,
    daysLeft
  };
}
