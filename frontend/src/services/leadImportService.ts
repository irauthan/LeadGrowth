import api from './api';

export interface LeadImportRow {
  rowNumber: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  sourcePlatform?: string;
  campaignName?: string;
  priority?: string;
  status?: string;
  location?: string;
  proposalAmount?: number;
  clientNotes?: string;
  isValid: boolean;
  validationErrors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  existingLeadId?: number;
}

export interface LeadImportPreviewResponse {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  detectedColumns: string[];
  columnMappings: Record<string, string>;
  rows: LeadImportRow[];
}

export interface LeadImportExecuteRequest {
  rows: LeadImportRow[];
  assignmentStrategy: 'AUTO' | 'ME' | 'SPECIFIC' | 'UNASSIGNED';
  assignedToId?: number;
  duplicateStrategy: 'SKIP' | 'UPDATE' | 'ALLOW';
  defaultSourcePlatform?: string;
  defaultPriority?: string;
  defaultStatus?: string;
  campaignId?: number;
}

export interface LeadImportResult {
  success: boolean;
  totalProcessed: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  messages: string[];
  createdLeadIds: number[];
}

export const downloadLeadTemplate = async (): Promise<void> => {
  try {
    const response = await api.get('/api/leads/import/template', {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LeadGrowth_Lead_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading lead template:', error);
    throw error;
  }
};

export const previewLeadImport = async (file: File): Promise<LeadImportPreviewResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<LeadImportPreviewResponse>('/api/leads/import/preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const executeLeadImport = async (payload: LeadImportExecuteRequest): Promise<LeadImportResult> => {
  const response = await api.post<LeadImportResult>('/api/leads/import/execute', payload);
  return response.data;
};
