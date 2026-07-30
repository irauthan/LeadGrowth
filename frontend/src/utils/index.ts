export const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number | undefined): string => {
  if (value === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

export const formatShortDate = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (e) {
    return dateString;
  }
};
