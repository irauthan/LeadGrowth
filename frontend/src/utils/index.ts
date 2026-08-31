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
      year: 'numeric',
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

export const isLeadAssigned = (lead: any): boolean => {
  if (!lead) return false;
  if (lead.assignedToId && lead.assignedToId > 0) return true;
  if (lead.assignedToName && lead.assignedToName !== 'Unassigned' && lead.assignedToName !== 'System Queue') return true;
  if (lead.queueStatus === 'ASSIGNED' || lead.queueStatus === 'IN_PIPELINE') return true;
  return false;
};

export const isLeadUntouched = (lead: any): boolean => {
  if (!lead) return false;
  const status = (lead.status || '').toLowerCase();
  if (status === 'converted' || status === 'lost' || status === 'rejected') return false;

  // If activities have any logged items or completed items, it's not untouched
  const hasActivities = Array.isArray(lead.activities) && lead.activities.some((act: any) => {
    const logs = act.activityLogs || act.logs || [];
    return logs.length > 0 || act.status === 'COMPLETED';
  });

  if (hasActivities) return false;

  // If stage is already moved forward beyond New with progress > 10%
  if (status !== 'new' && status !== 'fresh' && status !== '' && (lead.progressPercentage || 0) > 10) {
    return false;
  }

  // If there's an actual recorded interaction or followup
  if (lead.lastFollowupDate || lead.firstContactDate) {
    return false;
  }

  return true;
};

export const isLeadFresh = (lead: any): boolean => {
  if (!lead) return false;
  const status = (lead.status || '').toLowerCase();
  const isNewStage = status === 'new' || status === 'fresh' || status === '';
  if (!isNewStage) return false;

  // Check if lead was created within 48 hours or is in New stage without progress
  if (lead.createdAt) {
    const ageMs = Date.now() - new Date(lead.createdAt).getTime();
    if (ageMs <= 48 * 60 * 60 * 1000) return true;
  }
  return isNewStage;
};
