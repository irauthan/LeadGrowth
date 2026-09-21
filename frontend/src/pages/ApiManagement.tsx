import { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Lock, 
  Clock, 
  Loader2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { apiKeyService, type ApiKeyItem, type CreateApiKeyResponse } from '../services/apiKeyService';
import HoosshBeeLoader from '../components/HoosshBeeLoader';

export default function ApiManagement() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'Read-Only' | 'Full-Access'>('Full-Access');
  const [createdKeyResult, setCreatedKeyResult] = useState<CreateApiKeyResponse | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const data = await apiKeyService.getApiKeys();
      setKeys(data);
    } catch (err) {
      console.error('Failed to load API keys', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2500);
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setErrorMsg(null);
    setIsGenerating(true);
    try {
      const result = await apiKeyService.createApiKey(newKeyName.trim(), newKeyScope);
      setCreatedKeyResult(result);
      setNewKeyName('');
      await loadKeys();
    } catch (err: any) {
      console.error('Failed to generate key', err);
      setErrorMsg(err.response?.data?.message || 'Failed to create API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke API Key "${name}"? Third-party tools using this key will immediately lose access.`)) {
      return;
    }

    try {
      await apiKeyService.revokeApiKey(id);
      await loadKeys();
    } catch (err: any) {
      console.error('Failed to revoke key', err);
      alert(err.response?.data?.message || 'Failed to revoke API key.');
    }
  };

  if (loading && keys.length === 0) {
    return (
      <HoosshBeeLoader 
        text="Loading API Credentials..." 
        subtext="Fetching workspace authorization tokens and access permissions" 
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Upper Create Key Box */}
      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-theme-text flex items-center gap-2">
              <Key size={18} className="text-theme-primary" /> Workspace API Access Tokens
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-theme-bg-alt border border-theme-border text-theme-text-muted">
              Live Database Verified
            </span>
          </div>
          <p className="text-xs text-theme-text-muted mt-1">
            Generate and manage cryptographically secure authorization keys to authenticate external Webhooks, Zapier, Make, and custom CRM scripts.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g. Zapier Lead Ingest Connector..."
            className="flex-1 rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-semibold text-theme-text outline-none focus:border-theme-primary focus:bg-theme-card"
          />
          <select
            value={newKeyScope}
            onChange={(e) => setNewKeyScope(e.target.value as any)}
            className="rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-bold text-theme-text outline-none focus:border-theme-primary"
          >
            <option value="Full-Access">Full-Access Scope (Read & Write)</option>
            <option value="Read-Only">Read-Only Scope (Reporting Only)</option>
          </select>
          <button
            type="submit"
            disabled={isGenerating}
            className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-theme-primary/10 transition-all flex items-center gap-1.5 justify-center disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            <span>Generate Token</span>
          </button>
        </form>
      </div>

      {/* Secret One-Time Generated Banner / Modal */}
      {createdKeyResult && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4 animate-fadeIn">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                <CheckCircle2 size={18} />
                <span>API Key Generated Successfully: {createdKeyResult.name}</span>
              </div>
              <p className="text-xs text-theme-text leading-relaxed">
                Please copy your API secret now. <strong>For security reasons, this token will never be displayed again.</strong>
              </p>
            </div>

            <button
              onClick={() => setCreatedKeyResult(null)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              Done / Close
            </button>
          </div>

          <div className="flex items-center gap-2 bg-theme-card border border-theme-border rounded-2xl p-3 w-full">
            <Lock size={16} className="text-emerald-500 flex-shrink-0" />
            <input
              type="text"
              readOnly
              value={createdKeyResult.key}
              className="font-mono text-xs font-bold text-theme-text bg-transparent flex-1 outline-none select-all"
            />
            <button
              onClick={() => handleCopySecret(createdKeyResult.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs shrink-0"
            >
              {secretCopied ? <Check size={14} /> : <Copy size={14} />}
              <span>{secretCopied ? 'Copied!' : 'Copy Secret'}</span>
            </button>
          </div>
        </div>
      )}

      {/* API Key list cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-theme-text-muted uppercase tracking-wider">
            Active Workspace Credentials ({keys.length})
          </h4>
          <span className="text-[11px] text-theme-text-muted flex items-center gap-1">
            <ShieldCheck size={13} className="text-theme-primary" />
            <span>SHA-256 Hashed at Rest</span>
          </span>
        </div>

        {keys.map((k) => (
          <div key={k.id} className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-theme-text">{k.name}</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  k.scope === 'Full-Access' ? 'text-indigo-500 bg-indigo-500/10 border border-indigo-500/20' : 'text-slate-500 bg-slate-500/10 border border-slate-500/20'
                }`}>
                  {k.scope}
                </span>
                {k.createdByName && (
                  <span className="text-[10px] text-theme-text-muted">
                    by {k.createdByName}
                  </span>
                )}
              </div>

              {/* Key hash display */}
              <div className="flex items-center gap-2 bg-theme-bg-alt/50 border border-theme-border/60 rounded-xl p-2.5 w-full max-w-lg">
                <Lock size={14} className="text-theme-text-muted flex-shrink-0" />
                <span className="font-mono text-xs truncate flex-1 tracking-wider text-theme-text font-semibold">
                  {k.keyPrefix}
                </span>
                <button
                  onClick={() => handleCopy(k.id, k.keyPrefix)}
                  className="text-theme-text-muted hover:text-theme-primary p-1 flex-shrink-0"
                  title="Copy Key Prefix"
                >
                  {copiedId === k.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Info stamps */}
              <div className="flex items-center gap-4 text-[11px] text-theme-text-muted">
                <span className="flex items-center gap-1">
                  Created: <strong className="text-theme-text">{k.createdDate}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> Last Used: <strong className="text-theme-text">{k.lastUsed}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => handleRevokeKey(k.id, k.name)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 self-end sm:self-auto flex-shrink-0 border border-rose-500/20 text-xs font-bold transition-colors"
              title="Revoke and delete this token"
            >
              <Trash2 size={14} />
              <span>Revoke Key</span>
            </button>
          </div>
        ))}

        {keys.length === 0 && (
          <div className="rounded-3xl border border-theme-border bg-theme-card p-12 text-center shadow-sm space-y-2">
            <Key size={36} className="mx-auto text-theme-text-muted opacity-55" />
            <h3 className="text-sm font-bold text-theme-text">No Active API Credentials</h3>
            <p className="text-xs text-theme-text-muted max-w-sm mx-auto">
              Generate an access token above to authenticate third-party integrations with your LeadGrowth workspace.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
