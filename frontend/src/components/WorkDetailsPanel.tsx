import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  FileText, 
  History, 
  Save, 
  DollarSign, 
  TrendingUp,
  Plus,
  Calendar,
  Download
} from 'lucide-react';
import api from '../services/api';
import { downloadSingleLeadPdf } from '../services/reportService';

interface WorkDetailsPanelProps {
  leadId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
}

export default function WorkDetailsPanel({ leadId, isOpen, onClose, onLeadUpdated }: WorkDetailsPanelProps) {
  const [lead, setLead] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'activities' | 'notes' | 'timeline' | 'followup'>('activities');
  const [loading, setLoading] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [clientNotes, setClientNotes] = useState('');
  const [proposalAmount, setProposalAmount] = useState<number | string>('');

  // Followup form state
  const [followupType, setFollowupType] = useState('CALL');
  const [followupDate, setFollowupDate] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');
  const [schedulingFollowup, setSchedulingFollowup] = useState(false);

  useEffect(() => {
    if (leadId && isOpen) {
      fetchLeadDetails();
    }
  }, [leadId, isOpen]);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const [leadRes, timelineRes] = await Promise.all([
        api.get(`/api/leads/${leadId}`),
        api.get(`/api/leads/${leadId}/timeline`).catch(() => ({ data: [] }))
      ]);
      setLead(leadRes.data);
      setClientNotes(leadRes.data.clientNotes || '');
      setProposalAmount(leadRes.data.proposalAmount || '');
      setTimeline(timelineRes.data || []);
    } catch (err) {
      console.error('Failed to load lead details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityToggle = async (activityKey: string, currentStatus: string) => {
    if (!leadId) return;
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await api.patch(`/api/leads/${leadId}/activity`, null, {
        params: { activityKey, status: nextStatus }
      });
      setLead(res.data);
      fetchLeadDetails();
      onLeadUpdated();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update activity');
    }
  };

  const handleAutoSaveNotes = async (newNotes: string) => {
    setClientNotes(newNotes);
    setAutoSaveStatus('Auto-saving...');
    try {
      await api.patch(`/api/leads/${leadId}/auto-save`, {
        clientNotes: newNotes
      });
      setAutoSaveStatus('Saved Successfully');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    } catch (e) {
      setAutoSaveStatus('Failed to save');
    }
  };

  const handleProposalSave = async () => {
    if (!leadId) return;
    setSavingNotes(true);
    try {
      await api.patch(`/api/leads/${leadId}/auto-save`, {
        proposalAmount: Number(proposalAmount),
        proposalStatus: 'SENT'
      });
      setAutoSaveStatus('Proposal Details Saved');
      fetchLeadDetails();
      onLeadUpdated();
    } catch (e) {
      alert('Failed to save proposal');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !followupDate) return;
    setSchedulingFollowup(true);
    try {
      await api.post('/api/followups', {
        leadId,
        scheduledAt: followupDate,
        type: followupType,
        notes: followupNotes
      });
      alert('Follow-up scheduled successfully!');
      setFollowupNotes('');
      setFollowupDate('');
      fetchLeadDetails();
      onLeadUpdated();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to schedule follow-up');
    } finally {
      setSchedulingFollowup(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-3xl h-full bg-theme-bg border-l border-theme-border flex flex-col shadow-2xl overflow-y-auto"
        >
          {/* Top Header */}
          <div className="p-6 border-b border-theme-border/40 bg-theme-card flex items-center justify-between sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                  Lead #{leadId}
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  lead?.status === 'Converted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  lead?.status === 'Lost' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                  'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  Stage: {lead?.status || 'New'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-theme-text mt-1">{lead?.name || 'Loading details...'}</h2>
              <p className="text-xs text-theme-text-muted">{lead?.company || 'Enterprise Contact'} • {lead?.campaignName || 'Direct Search'}</p>
            </div>

            <div className="flex items-center gap-2">
              {leadId && (
                <button
                  onClick={() => downloadSingleLeadPdf(leadId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-theme-bg-alt border border-theme-border text-xs font-bold text-theme-text hover:bg-theme-card transition-all"
                  title="Export Branded PDF Dossier"
                >
                  <Download size={14} className="text-theme-primary" /> PDF Dossier
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-theme-bg-alt text-theme-text-muted hover:text-theme-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-3">
              <Clock size={36} className="animate-spin text-theme-primary" />
              <span className="text-xs font-bold text-theme-text-muted">Loading Work Workspace Details...</span>
            </div>
          ) : (
            <div className="p-6 space-y-6 flex-1">

              {/* Client Info Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-3xl bg-theme-card border border-theme-border shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Phone & Direct Call</span>
                  <a href={`tel:${lead?.phone}`} className="flex items-center gap-2 text-xs font-extrabold text-theme-primary hover:underline">
                    <Phone size={14} /> {lead?.phone || 'N/A'}
                  </a>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Email Contact</span>
                  <a href={`mailto:${lead?.email}`} className="flex items-center gap-2 text-xs font-extrabold text-theme-primary hover:underline truncate">
                    <Mail size={14} /> {lead?.email}
                  </a>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Priority & Quality</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">{lead?.qualityTier} ({lead?.qualityScore} pts)</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar Header */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-theme-primary/10 via-indigo-500/10 to-purple-500/10 border border-theme-primary/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-theme-text">
                  <span className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-theme-primary" /> Sales Execution Progress
                  </span>
                  <span className="text-theme-primary">{lead?.progressPercentage || 0}%</span>
                </div>
                <div className="w-full bg-theme-bg-alt rounded-full h-3 overflow-hidden border border-theme-border/40 p-0.5">
                  <div 
                    className="bg-gradient-to-r from-theme-primary via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${lead?.progressPercentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-theme-border/40 pb-2">
                {[
                  { id: 'activities', label: 'Sales Activities Checklist', icon: CheckCircle2 },
                  { id: 'notes', label: 'Notes & Proposal', icon: FileText },
                  { id: 'followup', label: 'Schedule Follow-up', icon: Calendar },
                  { id: 'timeline', label: 'CRM Timeline', icon: History }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                        isActive
                          ? 'bg-theme-primary text-white shadow-md shadow-theme-primary/20'
                          : 'bg-theme-bg-alt/50 text-theme-text-muted hover:text-theme-text'
                      }`}
                    >
                      <Icon size={14} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content 1: Sales Activities Checklist */}
              {activeTab === 'activities' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">
                      Required Workflow Steps
                    </h3>
                    {autoSaveStatus && (
                      <span className="text-[10px] font-bold text-emerald-400 animate-pulse">
                        {autoSaveStatus}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {lead?.activities?.map((act: any) => {
                      const isDone = act.status === 'COMPLETED';
                      return (
                        <div
                          key={act.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isDone 
                              ? 'bg-emerald-500/5 border-emerald-500/30' 
                              : 'bg-theme-card border-theme-border hover:border-theme-primary/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleActivityToggle(act.activityKey, act.status)}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                                  isDone 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'border-theme-border bg-theme-bg hover:border-theme-primary'
                                }`}
                              >
                                {isDone && <CheckCircle2 size={14} />}
                              </button>
                              <div>
                                <h4 className={`text-xs font-extrabold ${isDone ? 'line-through text-theme-text-muted' : 'text-theme-text'}`}>
                                  {act.title}
                                </h4>
                                {act.completedAt && (
                                  <span className="text-[9px] text-emerald-400 font-semibold block">
                                    Completed by {act.completedByName || 'Sales Rep'} • {new Date(act.completedAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-xl ${
                              isDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-theme-bg-alt text-theme-text-muted'
                            }`}>
                              {act.status}
                            </span>
                          </div>

                          {/* Activity Remarks */}
                          <div className="mt-3 pt-3 border-t border-theme-border/20">
                            <input
                              type="text"
                              placeholder="Add activity remarks or client response..."
                              defaultValue={act.remarks || ''}
                              onBlur={(e) => {
                                if (e.target.value !== act.remarks) {
                                  api.patch(`/api/leads/${leadId}/activity`, null, {
                                    params: { activityKey: act.activityKey, status: act.status, remarks: e.target.value }
                                  });
                                }
                              }}
                              className="w-full bg-theme-bg-alt/50 border border-theme-border/30 rounded-xl px-3 py-1.5 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab Content 2: Notes & Proposal */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Proposal Section */}
                  <div className="p-5 rounded-3xl bg-theme-card border border-theme-border space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-400" /> Commercial Proposal Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Proposal Amount ($)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          value={proposalAmount}
                          onChange={(e) => setProposalAmount(e.target.value)}
                          className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl px-4 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleProposalSave}
                          disabled={savingNotes}
                          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white shadow-lg transition-all"
                        >
                          <Save size={14} /> Update Proposal Amount
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Auto-Save Notes */}
                  <div className="p-5 rounded-3xl bg-theme-card border border-theme-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                        <FileText size={16} className="text-theme-primary" /> Client Notes & Requirement Collection
                      </h3>
                      {autoSaveStatus && (
                        <span className="text-[10px] font-bold text-emerald-400 animate-pulse">
                          {autoSaveStatus}
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={6}
                      placeholder="Type client meeting notes, requirements, or deal progress details. Auto-saves automatically..."
                      value={clientNotes}
                      onChange={(e) => handleAutoSaveNotes(e.target.value)}
                      className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl p-4 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                    />
                  </div>
                </div>
              )}

              {/* Tab Content 3: Schedule Follow-up */}
              {activeTab === 'followup' && (
                <form onSubmit={handleScheduleFollowup} className="p-5 rounded-3xl bg-theme-card border border-theme-border space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                    <Calendar size={16} className="text-cyan-400" /> Schedule Client Follow-up Call / Email
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Follow-up Type</label>
                      <select
                        value={followupType}
                        onChange={(e) => setFollowupType(e.target.value)}
                        className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl px-4 py-2.5 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                      >
                        <option value="CALL">Phone Call 📞</option>
                        <option value="EMAIL">Send Email 📧</option>
                        <option value="MEETING">Video Meeting 💻</option>
                        <option value="DEMO">Product Demo 🎯</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={followupDate}
                        onChange={(e) => setFollowupDate(e.target.value)}
                        className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl px-4 py-2 text-xs font-bold text-theme-text focus:outline-none focus:border-theme-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-theme-text-muted block mb-1">Follow-up Objectives / Remarks</label>
                    <textarea
                      rows={3}
                      placeholder="Key topics to discuss in the upcoming call..."
                      value={followupNotes}
                      onChange={(e) => setFollowupNotes(e.target.value)}
                      className="w-full bg-theme-bg-alt border border-theme-border rounded-2xl p-3 text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={schedulingFollowup}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-theme-primary to-indigo-600 hover:from-theme-primary-hover hover:to-indigo-500 text-xs font-bold text-white shadow-lg transition-all"
                  >
                    <Plus size={16} /> Schedule Reminder
                  </button>
                </form>
              )}

              {/* Tab Content 4: CRM Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-muted flex items-center gap-2">
                    <History size={16} className="text-theme-primary" /> Complete Client History Timeline
                  </h3>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-theme-border">
                    {timeline.map((item: any) => (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-theme-primary border-2 border-theme-bg" />
                        <div className="p-4 rounded-2xl bg-theme-card border border-theme-border shadow-xs space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-theme-text">
                            <span className="text-theme-primary">{item.action}</span>
                            <span className="text-[10px] text-theme-text-muted">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-theme-text-muted">{item.description}</p>
                          <span className="text-[9px] font-semibold text-theme-text-muted block">
                            By {item.performedByName || 'System'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {timeline.length === 0 && (
                      <p className="text-xs text-theme-text-muted text-center py-6">No historical records logged yet.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
