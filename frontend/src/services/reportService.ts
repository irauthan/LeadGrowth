import api from './api';

export const downloadReport = async (
  type: 'campaigns' | 'leads',
  format: 'csv' | 'excel' | 'pdf'
): Promise<void> => {
  try {
    const response = await api.get(`/api/reports/${type}/${format}`, {
      responseType: 'blob',
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
