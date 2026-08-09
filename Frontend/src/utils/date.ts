export const getDaysRemaining = (expirationDateStr: string): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Parse expiration date and set to midnight to avoid time-of-day offsets
  const expDate = new Date(expirationDateStr);
  const expToday = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
  
  const diffTime = expToday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export interface FreshnessStatus {
  label: string;
  colorClass: string;
  bgClass: string;
  textClass: string;
  statusType: 'active' | 'expiring' | 'expired';
}

export const getFreshnessStatus = (daysRemaining: number): FreshnessStatus => {
  if (daysRemaining < 0) {
    return {
      label: 'Expired',
      colorClass: 'bg-red-500',
      bgClass: 'bg-red-50 dark:bg-red-950/20',
      textClass: 'text-red-650 dark:text-red-400',
      statusType: 'expired',
    };
  } else if (daysRemaining <= 7) {
    return {
      label: 'Expiring Soon',
      colorClass: 'bg-orange-500',
      bgClass: 'bg-orange-50 dark:bg-orange-950/20',
      textClass: 'text-orange-600 dark:text-orange-400',
      statusType: 'expiring',
    };
  } else {
    return {
      label: 'Active',
      colorClass: 'bg-emerald-500',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      statusType: 'active',
    };
  }
};

export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};
export default { getDaysRemaining, getFreshnessStatus, formatDate };
