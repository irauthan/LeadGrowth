import api from './api';

export const downloadReport = async (
  type: 'campaigns' | 'leads',
  format: 'csv' | 'excel' | 'pdf',
  period?: string,
  startDate?: string,
  endDate?: string,
  userId?: number
): Promise<void> => {
  try {
    const params: any = {};
    if (period) params.period = period;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (userId && userId > 0) params.userId = userId;

    const response = await api.get(`/api/reports/${type}/${format}`, {
      responseType: 'blob',
      params,
    });

    const fileExtension = format === 'excel' ? 'xlsx' : format;
    const mimeTypes: Record<string, string> = {
      csv: 'text/csv',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf',
    };

    const contentType = typeof response.headers['content-type'] === 'string' ? response.headers['content-type'] : undefined;
    const blob = new Blob([response.data], {
      type: mimeTypes[format] || contentType || 'application/octet-stream',
    });

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;

    let filename = `${type}_report_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
    const disposition = response.headers['content-disposition'];
    if (typeof disposition === 'string' && disposition.includes('filename=')) {
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error(`Failed to download ${type} ${format} report:`, error);
    throw error;
  }
};

export const downloadSingleLeadPdf = async (leadInput: number | any): Promise<void> => {
  try {
    const leadId = typeof leadInput === 'object' && leadInput !== null
      ? (leadInput.id || leadInput.leadId || leadInput._id)
      : leadInput;

    if (!leadId) {
      throw new Error('Valid Lead ID is required for PDF export');
    }

    const response = await api.get(`/api/reports/leads/${leadId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `lead_${leadId}_dossier.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error(`Failed to download lead PDF report:`, error);
    throw error;
  }
};
