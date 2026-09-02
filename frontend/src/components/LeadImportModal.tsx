import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Users, 
  UserCheck, 
  Sparkles, 
  Database, 
  Layers, 
  Filter, 
  CheckSquare, 
  Square, 
  Loader2,
  Info,
  ChevronDown
} from 'lucide-react';
import { 
  downloadLeadTemplate, 
  previewLeadImport, 
  executeLeadImport, 
  type LeadImportRow, 
  type LeadImportPreviewResponse, 
  type LeadImportResult 
} from '../services/leadImportService';
import type { User } from '../types';

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  currentUser: any;
  teamMembers: User[];
  campaigns: any[];
}

export default function LeadImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  currentUser,
  teamMembers,
  campaigns
}: LeadImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preview Data
  const [previewData, setPreviewData] = useState<LeadImportPreviewResponse | null>(null);
  const [selectedRowNumbers, setSelectedRowNumbers] = useState<Set<number>>(new Set());
  const [filterTab, setFilterTab] = useState<'ALL' | 'VALID' | 'DUPLICATES' | 'ERRORS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Intake Configuration
  const isManagement = currentUser?.roles?.includes('ROLE_ADMIN') || currentUser?.roles?.includes('ROLE_MANAGER');
  const [assignmentStrategy, setAssignmentStrategy] = useState<'AUTO' | 'ME' | 'SPECIFIC' | 'UNASSIGNED'>('AUTO');
  const [assignedToId, setAssignedToId] = useState<number | undefined>(undefined);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'SKIP' | 'UPDATE' | 'ALLOW'>('SKIP');
  const [defaultSource, setDefaultSource] = useState('Excel Intake');
  const [defaultPriority, setDefaultPriority] = useState('MEDIUM');
  const [defaultStatus, setDefaultStatus] = useState('New');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | undefined>(undefined);

  // Import Result
  const [importResult, setImportResult] = useState<LeadImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadLeadTemplate();
    } catch (err: any) {
      setErrorMsg('Failed to download sample Excel template.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile: File) => {
    setErrorMsg(null);
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = uploadedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Please upload a valid Microsoft Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    if (uploadedFile.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 15MB limit.');
      return;
    }

    setFile(uploadedFile);
  };

  const handleProcessFile = async () => {
    if (!file) {
      setErrorMsg('Please select an Excel or CSV file first.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await previewLeadImport(file);
      setPreviewData(data);
      // By default select all valid and duplicate rows (excluding hard error rows)
      const validNumbers = new Set<number>(
        data.rows.filter(r => r.isValid).map(r => r.rowNumber)
      );
      setSelectedRowNumbers(validNumbers);
      setStep(2); // Go to Intake Config & Mapping
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error processing spreadsheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPreview = () => {
    setStep(3); // Go to Interactive Data Review
  };

  const handleToggleRow = (rowNum: number) => {
    const next = new Set(selectedRowNumbers);
    if (next.has(rowNum)) {
      next.delete(rowNum);
    } else {
      next.add(rowNum);
    }
    setSelectedRowNumbers(next);
  };

  const handleToggleAllFiltered = (rowsToToggle: LeadImportRow[]) => {
    const allSelected = rowsToToggle.every(r => selectedRowNumbers.has(r.rowNumber));
    const next = new Set(selectedRowNumbers);
    if (allSelected) {
      rowsToToggle.forEach(r => next.delete(r.rowNumber));
    } else {
      rowsToToggle.forEach(r => {
        if (r.isValid) next.add(r.rowNumber);
      });
    }
    setSelectedRowNumbers(next);
  };

  const handleExecuteImport = async () => {
    if (!previewData) return;

    // Filter only selected rows
    const rowsToImport = previewData.rows.filter(r => selectedRowNumbers.has(r.rowNumber));
    if (rowsToImport.length === 0) {
      setErrorMsg('Please select at least 1 row to import.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        rows: rowsToImport,
        assignmentStrategy,
        assignedToId: assignmentStrategy === 'SPECIFIC' ? assignedToId : undefined,
        duplicateStrategy,
        defaultSourcePlatform: defaultSource,
        defaultPriority,
        defaultStatus,
        campaignId: selectedCampaignId
      };

      const result = await executeLeadImport(payload);
      setImportResult(result);
      setStep(4); // Success Summary
      onImportSuccess();
      window.dispatchEvent(new Event('leadgrowth-notification-updated'));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to complete lead intake.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setFile(null);
    setPreviewData(null);
    setSelectedRowNumbers(new Set());
    setImportResult(null);
    setErrorMsg(null);
    onClose();
  };

  // Filtered rows for Step 3
  const getFilteredRows = () => {
    if (!previewData) return [];
    let rows = previewData.rows;

    if (filterTab === 'VALID') {
      rows = rows.filter(r => r.isValid && !r.isDuplicate);
    } else if (filterTab === 'DUPLICATES') {
      rows = rows.filter(r => r.isDuplicate);
    } else if (filterTab === 'ERRORS') {
      rows = rows.filter(r => !r.isValid);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r => 
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.company?.toLowerCase().includes(q)
      );
    }

    return rows;
  };

  const displayedRows = getFilteredRows();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-theme-border bg-theme-card text-theme-text shadow-2xl overflow-hidden transition-all">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-bg/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-theme-text flex items-center gap-2">
                Excel Sheet Lead Reader & Direct Intake
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  v2.0 Hybrid Engine
                </span>
              </h2>
              <p className="text-xs text-theme-text-muted">
                Intelligent Excel/CSV parser with auto-column detection, duplicate cross-matching, and instant workspace lead intake.
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="px-6 py-3 border-b border-theme-border bg-theme-card/60 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6 w-full">
            {[
              { num: 1, label: 'Upload Sheet' },
              { num: 2, label: 'Intake Strategy' },
              { num: 3, label: 'Data Preview & Filters' },
              { num: 4, label: 'Results' }
            ].map((s, idx) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast 
                        ? 'bg-emerald-500 text-white' 
                        : isActive 
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md shadow-indigo-500/30' 
                        : 'bg-theme-bg-alt text-theme-text-muted border border-theme-border'
                    }`}
                  >
                    {isPast ? <Check size={14} /> : s.num}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${isActive ? 'text-theme-text font-bold' : 'text-theme-text-muted'}`}>
                    {s.label}
                  </span>
                  {idx < 3 && (
                    <div className={`h-0.5 flex-1 mx-2 transition-all ${isPast ? 'bg-emerald-500' : 'bg-theme-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-500 text-xs font-semibold animate-shake">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="hover:opacity-80">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

          {/* STEP 1: UPLOAD EXCEL / CSV */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Template Download Card */}
              <div className="p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-theme-text">Need the official Excel Template?</h4>
                    <p className="text-xs text-theme-text-muted">
                      Download pre-formatted workbook (.xlsx) with sample rows, validation hints, and instructions.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all shrink-0"
                >
                  {downloadingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Download Sample (.xlsx)</span>
                </button>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
                    : file 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-theme-border hover:border-indigo-500/50 hover:bg-theme-bg-alt/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${
                  file 
                    ? 'bg-emerald-500/20 text-emerald-500 ring-8 ring-emerald-500/10' 
                    : 'bg-indigo-500/10 text-indigo-500 ring-8 ring-indigo-500/5'
                }`}>
                  {file ? <FileSpreadsheet size={32} /> : <UploadCloud size={32} />}
                </div>

                <div>
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-base font-extrabold text-emerald-500 flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> {file.name}
                      </p>
                      <p className="text-xs text-theme-text-muted font-medium">
                        {(file.size / 1024).toFixed(1)} KB — Ready to read & validate
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-theme-text">
                        Drag and drop your Excel (.xlsx, .xls) or CSV sheet here
                      </p>
                      <p className="text-xs text-theme-text-muted">
                        or click to browse your computer (Max file size: 15MB)
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-theme-text-muted">
                  <span className="px-2 py-0.5 rounded-md bg-theme-bg-alt border border-theme-border font-mono">.xlsx</span>
                  <span className="px-2 py-0.5 rounded-md bg-theme-bg-alt border border-theme-border font-mono">.xls</span>
                  <span className="px-2 py-0.5 rounded-md bg-theme-bg-alt border border-theme-border font-mono">.csv</span>
                </div>
              </div>

              {/* Supported Columns Guide Note */}
              <div className="p-4 rounded-2xl border border-theme-border bg-theme-bg/40 text-xs text-theme-text-muted space-y-1.5">
                <div className="font-bold text-theme-text flex items-center gap-1.5">
                  <Info size={14} className="text-indigo-500" />
                  <span>Smart Auto-Mapping Engine:</span>
                </div>
                <p>
                  The system automatically detects columns like <code className="text-indigo-400">Full Name</code>, <code className="text-indigo-400">Email Address</code>, <code className="text-indigo-400">Phone Number</code>, <code className="text-indigo-400">Company</code>, <code className="text-indigo-400">Source Platform</code>, <code className="text-indigo-400">Priority</code>, <code className="text-indigo-400">Status</code>, <code className="text-indigo-400">Proposal Amount</code>, <code className="text-indigo-400">Notes</code>, and <code className="text-indigo-400">Location</code> even if your sheet uses different column names.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: INTAKE STRATEGY & CONFIG */}
          {step === 2 && previewData && (
            <div className="space-y-6">
              {/* Quick Summary Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border border-theme-border bg-theme-bg/40">
                  <span className="text-[10px] font-bold text-theme-text-muted uppercase">Total Rows Read</span>
                  <div className="text-xl font-extrabold text-theme-text mt-0.5">{previewData.totalRows}</div>
                </div>
                <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Valid Records</span>
                  <div className="text-xl font-extrabold text-emerald-500 mt-0.5">{previewData.validRows}</div>
                </div>
                <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <span className="text-[10px] font-bold text-amber-500 uppercase">Existing Duplicates</span>
                  <div className="text-xl font-extrabold text-amber-500 mt-0.5">{previewData.duplicateRows}</div>
                </div>
                <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                  <span className="text-[10px] font-bold text-rose-500 uppercase">Missing / Errors</span>
                  <div className="text-xl font-extrabold text-rose-500 mt-0.5">{previewData.invalidRows}</div>
                </div>
              </div>

              {/* Assignment Strategy Configuration */}
              <div className="p-5 rounded-3xl border border-theme-border bg-theme-bg/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
                      <UserCheck size={16} className="text-indigo-500" />
                      1. Lead Distribution & Assignment Strategy
                    </h4>
                    <p className="text-xs text-theme-text-muted">
                      Choose how incoming leads from the spreadsheet will be assigned in your workspace.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Auto Hybrid Engine */}
                  <div 
                    onClick={() => setAssignmentStrategy('AUTO')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      assignmentStrategy === 'AUTO'
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                        : 'border-theme-border hover:bg-theme-bg-alt'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-theme-text">
                        <Sparkles size={14} className="text-indigo-500" />
                        <span>Smart Round-Robin / Capacity</span>
                      </div>
                      <input 
                        type="radio" 
                        name="assignStrat" 
                        checked={assignmentStrategy === 'AUTO'} 
                        onChange={() => setAssignmentStrategy('AUTO')} 
                        className="text-indigo-600"
                      />
                    </div>
                    <p className="text-[11px] text-theme-text-muted mt-1.5">
                      Distributes leads evenly to available active team members respecting max capacity.
                    </p>
                  </div>

                  {/* Option 2: Assign to Me */}
                  <div 
                    onClick={() => setAssignmentStrategy('ME')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      assignmentStrategy === 'ME'
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                        : 'border-theme-border hover:bg-theme-bg-alt'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-theme-text">
                        <Users size={14} className="text-indigo-500" />
                        <span>Assign to Myself ({currentUser?.fullName || currentUser?.name || 'Me'})</span>
                      </div>
                      <input 
                        type="radio" 
                        name="assignStrat" 
                        checked={assignmentStrategy === 'ME'} 
                        onChange={() => setAssignmentStrategy('ME')} 
                        className="text-indigo-600"
                      />
                    </div>
                    <p className="text-[11px] text-theme-text-muted mt-1.5">
                      Directly intake all spreadsheet leads straight to your personal pipeline.
                    </p>
                  </div>

                  {/* Option 3: Specific Team Member (Admin/Manager or Workspace) */}
                  {isManagement && (
                    <div 
                      onClick={() => setAssignmentStrategy('SPECIFIC')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        assignmentStrategy === 'SPECIFIC'
                          ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                          : 'border-theme-border hover:bg-theme-bg-alt'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xs text-theme-text">
                          <UserCheck size={14} className="text-indigo-500" />
                          <span>Assign to Specific Team Member</span>
                        </div>
                        <input 
                          type="radio" 
                          name="assignStrat" 
                          checked={assignmentStrategy === 'SPECIFIC'} 
                          onChange={() => setAssignmentStrategy('SPECIFIC')} 
                          className="text-indigo-600"
                        />
                      </div>
                      {assignmentStrategy === 'SPECIFIC' && (
                        <div className="mt-2.5">
                          <select
                            value={assignedToId || ''}
                            onChange={(e) => setAssignedToId(Number(e.target.value))}
                            className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-theme-card border border-theme-border text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select Team Member...</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.fullName || m.name} ({m.designation || 'Sales Rep'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Option 4: Workspace Lead Queue (Unassigned) */}
                  <div 
                    onClick={() => setAssignmentStrategy('UNASSIGNED')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      assignmentStrategy === 'UNASSIGNED'
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                        : 'border-theme-border hover:bg-theme-bg-alt'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-theme-text">
                        <Layers size={14} className="text-indigo-500" />
                        <span>Leave Unassigned (Workspace Queue)</span>
                      </div>
                      <input 
                        type="radio" 
                        name="assignStrat" 
                        checked={assignmentStrategy === 'UNASSIGNED'} 
                        onChange={() => setAssignmentStrategy('UNASSIGNED')} 
                        className="text-indigo-600"
                      />
                    </div>
                    <p className="text-[11px] text-theme-text-muted mt-1.5">
                      Holds leads in the shared queue for later manual dispatch or claiming.
                    </p>
                  </div>
                </div>
              </div>

              {/* Duplicate Handling Policy */}
              <div className="p-5 rounded-3xl border border-theme-border bg-theme-bg/40 space-y-4">
                <div>
                  <h4 className="text-sm font-extrabold text-theme-text flex items-center gap-2">
                    <Database size={16} className="text-amber-500" />
                    2. Duplicate Prevention & Matching Policy
                  </h4>
                  <p className="text-xs text-theme-text-muted">
                    How should the system handle rows with matching emails or phone numbers already in workspace?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'SKIP', title: 'Skip Duplicates', desc: 'Ignore duplicate rows to protect existing lead data.' },
                    { id: 'UPDATE', title: 'Update Existing Leads', desc: 'Enrich existing leads with new phone, notes & amount.' },
                    { id: 'ALLOW', title: 'Import as New Leads', desc: 'Create fresh lead entries even if email/phone matches.' }
                  ].map(policy => (
                    <div
                      key={policy.id}
                      onClick={() => setDuplicateStrategy(policy.id as any)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        duplicateStrategy === policy.id
                          ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                          : 'border-theme-border hover:bg-theme-bg-alt'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-theme-text">{policy.title}</span>
                        <input 
                          type="radio" 
                          name="dupPolicy" 
                          checked={duplicateStrategy === policy.id} 
                          onChange={() => setDuplicateStrategy(policy.id as any)} 
                          className="text-amber-600"
                        />
                      </div>
                      <p className="text-[11px] text-theme-text-muted mt-1">{policy.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defaults & Campaign Mapping */}
              <div className="p-5 rounded-3xl border border-theme-border bg-theme-bg/40 space-y-4">
                <h4 className="text-sm font-extrabold text-theme-text">
                  3. Default Values & Optional Campaign Association
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-theme-text-muted mb-1 uppercase">
                      Default Source Platform
                    </label>
                    <input
                      type="text"
                      value={defaultSource}
                      onChange={(e) => setDefaultSource(e.target.value)}
                      placeholder="e.g. Excel Intake, Meta Ads"
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-theme-card border border-theme-border text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-theme-text-muted mb-1 uppercase">
                      Default Priority Tier
                    </label>
                    <select
                      value={defaultPriority}
                      onChange={(e) => setDefaultPriority(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-theme-card border border-theme-border text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="HIGH">HOT / HIGH</option>
                      <option value="MEDIUM">WARM / MEDIUM</option>
                      <option value="LOW">COLD / LOW</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-theme-text-muted mb-1 uppercase">
                      Link to Campaign (Optional)
                    </label>
                    <select
                      value={selectedCampaignId || ''}
                      onChange={(e) => setSelectedCampaignId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-theme-card border border-theme-border text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">No Campaign Tag</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.platform || 'General'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INTERACTIVE DATA PREVIEW & FILTER */}
          {step === 3 && previewData && (
            <div className="space-y-4">
              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-theme-bg/60 border border-theme-border">
                  {[
                    { id: 'ALL', label: 'All Records', count: previewData.totalRows },
                    { id: 'VALID', label: 'Valid Ready', count: previewData.validRows },
                    { id: 'DUPLICATES', label: 'Duplicates', count: previewData.duplicateRows },
                    { id: 'ERRORS', label: 'Issues', count: previewData.invalidRows }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        filterTab === tab.id
                          ? 'bg-theme-card text-theme-text shadow-sm'
                          : 'text-theme-text-muted hover:text-theme-text'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        tab.id === 'ERRORS' && tab.count > 0 
                          ? 'bg-rose-500/20 text-rose-500' 
                          : tab.id === 'DUPLICATES' && tab.count > 0
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-theme-bg-alt text-theme-text-muted'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search preview rows..."
                      className="w-full text-xs px-3 py-1.5 rounded-xl bg-theme-bg/50 border border-theme-border text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={() => handleToggleAllFiltered(displayedRows)}
                    className="px-3 py-1.5 rounded-xl border border-theme-border bg-theme-bg/50 text-xs font-bold text-theme-text hover:bg-theme-bg-alt shrink-0"
                  >
                    Toggle All
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-theme-border rounded-2xl overflow-hidden bg-theme-card">
                <div className="max-h-[420px] overflow-x-auto overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-theme-bg/80 sticky top-0 border-b border-theme-border backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-3 py-2.5 w-10">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="px-3 py-2.5 font-bold text-theme-text">#</th>
                        <th className="px-3 py-2.5 font-bold text-theme-text">Name</th>
                        <th className="px-3 py-2.5 font-bold text-theme-text">Email / Phone</th>
                        <th className="px-3 py-2.5 font-bold text-theme-text">Company</th>
                        <th className="px-3 py-2.5 font-bold text-theme-text">Source</th>
                        <th className="px-3 py-2.5 font-bold text-theme-text">Priority</th>
                        <th className="px-3 py-2.5 font-bold text-theme-text">Budget / Notes</th>
                        <th className="px-3 py-2.5 font-bold text-theme-text">Status & Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/50">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-theme-text-muted">
                            No records found matching this filter tab.
                          </td>
                        </tr>
                      ) : (
                        displayedRows.map((row) => {
                          const isSelected = selectedRowNumbers.has(row.rowNumber);
                          return (
                            <tr 
                              key={row.rowNumber}
                              onClick={() => row.isValid && handleToggleRow(row.rowNumber)}
                              className={`transition-colors cursor-pointer ${
                                !row.isValid 
                                  ? 'bg-rose-500/5 opacity-70' 
                                  : row.isDuplicate
                                  ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                  : isSelected
                                  ? 'bg-indigo-500/5 hover:bg-indigo-500/10'
                                  : 'hover:bg-theme-bg-alt/50'
                              }`}
                            >
                              <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={!row.isValid}
                                  onChange={() => handleToggleRow(row.rowNumber)}
                                  className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="px-3 py-2 font-mono text-[11px] text-theme-text-muted">
                                {row.rowNumber}
                              </td>
                              <td className="px-3 py-2 font-bold text-theme-text">
                                {row.name || <span className="text-rose-500 italic">Missing Name</span>}
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-mono text-[11px] text-theme-text">{row.email || '—'}</div>
                                <div className="text-[10px] text-theme-text-muted">{row.phone || ''}</div>
                              </td>
                              <td className="px-3 py-2 text-theme-text">
                                {row.company || '—'}
                              </td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-theme-bg-alt border border-theme-border text-theme-text">
                                  {row.sourcePlatform || defaultSource}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  row.priority?.toUpperCase() === 'HIGH' || row.priority?.toUpperCase() === 'HOT'
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                    : row.priority?.toUpperCase() === 'LOW' || row.priority?.toUpperCase() === 'COLD'
                                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                }`}>
                                  {row.priority || defaultPriority}
                                </span>
                              </td>
                              <td className="px-3 py-2 max-w-xs truncate text-[11px]">
                                {row.proposalAmount ? (
                                  <span className="font-bold text-emerald-500 mr-2">${row.proposalAmount.toLocaleString()}</span>
                                ) : null}
                                <span className="text-theme-text-muted">{row.clientNotes || '—'}</span>
                              </td>
                              <td className="px-3 py-2">
                                {row.validationErrors && row.validationErrors.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                    <AlertCircle size={11} /> {row.validationErrors[0]}
                                  </span>
                                ) : row.isDuplicate ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20" title={row.duplicateReason}>
                                    <AlertTriangle size={11} /> Duplicate Detected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <CheckCircle2 size={11} /> Valid
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-theme-text-muted px-1">
                <span>
                  Selected: <strong className="text-theme-text font-bold">{selectedRowNumbers.size}</strong> of {previewData.totalRows} leads
                </span>
                <span>
                  Intake Strategy: <strong className="text-indigo-500 font-bold">{assignmentStrategy}</strong> | Duplicates: <strong className="text-amber-500 font-bold">{duplicateStrategy}</strong>
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT EXECUTION RESULTS */}
          {step === 4 && importResult && (
            <div className="space-y-6 text-center py-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5 mx-auto flex items-center justify-center animate-bounce-short">
                <CheckCircle2 size={44} />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-theme-text">Lead Intake Completed Successfully!</h3>
                <p className="text-xs text-theme-text-muted mt-1">
                  Your Excel sheet leads have been processed and seamlessly ingested into the workspace.
                </p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Leads Ingested</span>
                  <div className="text-2xl font-extrabold text-emerald-500 mt-1">{importResult.importedCount}</div>
                </div>
                <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase">Updated</span>
                  <div className="text-2xl font-extrabold text-indigo-500 mt-1">{importResult.updatedCount}</div>
                </div>
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10">
                  <span className="text-[10px] font-bold text-amber-500 uppercase">Skipped (Duplicates)</span>
                  <div className="text-2xl font-extrabold text-amber-500 mt-1">{importResult.skippedCount}</div>
                </div>
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10">
                  <span className="text-[10px] font-bold text-rose-500 uppercase">Errors</span>
                  <div className="text-2xl font-extrabold text-rose-500 mt-1">{importResult.errorCount}</div>
                </div>
              </div>

              {/* Messages Breakdown */}
              {importResult.messages && importResult.messages.length > 0 && (
                <div className="max-w-2xl mx-auto p-4 rounded-2xl border border-theme-border bg-theme-bg/50 text-left text-xs space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                  {importResult.messages.map((m, i) => (
                    <div key={i} className="text-theme-text-muted font-mono text-[11px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-bg/50">
          <div>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt transition-all"
              >
                <ArrowLeft size={14} /> Back to File
              </button>
            )}
            {step === 3 && (
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-alt transition-all"
              >
                <ArrowLeft size={14} /> Back to Strategy
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === 1 && (
              <button
                onClick={handleProcessFile}
                disabled={!file || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                <span>Read & Parse Sheet</span>
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleProceedToPreview}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>Review Data & Preview</span>
                <ArrowRight size={16} />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleExecuteImport}
                disabled={selectedRowNumbers.size === 0 || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>Confirm & Intake {selectedRowNumbers.size} Leads</span>
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleResetAndClose}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Check size={16} />
                <span>View Ingested Leads</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
