import { useState } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Lock, 
  Clock, 
  Eye, 
  EyeOff 
} from 'lucide-react';

interface ApiKeyItem {
  id: number;
  name: string;
  key: string;
  createdDate: string;
  lastUsed: string;
  scope: 'Read-Only' | 'Full-Access';
  visible: boolean;
}

export default function ApiManagement() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([
    { id: 1, name: 'Meta Ads Auto-Sync', key: 'pk_live_51Nsb6D82Fh618Ksa918Ahbd271', createdDate: '2026-02-15', lastUsed: '5m ago', scope: 'Full-Access', visible: false },
    { id: 2, name: 'Zapier CRM Connector', key: 'pk_live_92JasD81Kas9187311Ksa8173', createdDate: '2026-03-01', lastUsed: '1h ago', scope: 'Full-Access', visible: false },
    { id: 3, name: 'Google Ads Read Connector', key: 'pk_live_01Lsd921Khs1298411Khs9824', createdDate: '2026-04-12', lastUsed: '2d ago', scope: 'Read-Only', visible: false },
  ]);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'Read-Only' | 'Full-Access'>('Full-Access');

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randStr = 'pk_live_';
    for (let i = 0; i < 22; i++) {
      randStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newKey: ApiKeyItem = {
      id: Date.now(),
      name: newKeyName,
      key: randStr,
      createdDate: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      scope: newKeyScope,
      visible: false
    };

    setKeys([...keys, newKey]);
    setNewKeyName('');
  };

  const handleDeleteKey = (id: number) => {
    setKeys(keys.filter(k => k.id !== id));
  };

  const toggleVisibility = (id: number) => {
    setKeys(keys.map(k => k.id === id ? { ...k, visible: !k.visible } : k));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Upper Create Key Box */}
      <div className="rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Key size={18} className="text-theme-primary" /> Generate Workspace API Credentials
          </h3>
          <p className="text-xs text-theme-text-muted mt-1">Authenticate third-party advertising hooks or custom CRM tools using secure authorization tokens.</p>
        </div>

        <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g. Agency Reporting Hub..."
            className="flex-1 rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-semibold outline-none focus:border-theme-primary focus:bg-theme-card"
          />
          <select
            value={newKeyScope}
            onChange={(e) => setNewKeyScope(e.target.value as any)}
            className="rounded-2xl border border-theme-border bg-theme-bg-alt/50 px-4 py-2.5 text-xs font-bold outline-none focus:border-theme-primary"
          >
            <option value="Full-Access">Full-Access Scope</option>
            <option value="Read-Only">Read-Only Scope</option>
          </select>
          <button
            type="submit"
            className="rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-theme-primary/10 transition-all flex items-center gap-1.5 justify-center"
          >
            <Plus size={14} /> Generate Token
          </button>
        </form>
      </div>

      {/* API Key list cards */}
      <div className="space-y-4">
        {keys.map((k) => (
          <div key={k.id} className="rounded-3xl border border-theme-border bg-theme-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-theme-text">{k.name}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  k.scope === 'Full-Access' ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-500 bg-slate-500/10'
                }`}>
                  {k.scope}
                </span>
              </div>

              {/* Key hash display */}
              <div className="flex items-center gap-2 bg-theme-bg-alt/45 border border-theme-border/20 rounded-xl p-2.5 w-full max-w-lg">
                <Lock size={14} className="text-theme-text-muted flex-shrink-0" />
                <span className="font-mono text-xs truncate flex-1 tracking-wider text-theme-text">
                  {k.visible ? k.key : '••••••••••••••••••••••••••••••••••••••••'}
                </span>
                <button
                  onClick={() => toggleVisibility(k.id)}
                  className="text-theme-text-muted hover:text-theme-text p-1 flex-shrink-0"
                >
                  {k.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => handleCopy(k.id, k.key)}
                  className="text-theme-text-muted hover:text-theme-primary p-1 flex-shrink-0"
                >
                  {copiedId === k.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Info stamps */}
              <div className="flex items-center gap-4 text-[10px] text-theme-text-muted">
                <span className="flex items-center gap-1">
                  Created: <strong>{k.createdDate}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} /> Active Sync: <strong>{k.lastUsed}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => handleDeleteKey(k.id)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 self-end sm:self-auto flex-shrink-0 border border-rose-500/10 transition-colors"
              title="Revoke Token"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {keys.length === 0 && (
          <div className="rounded-3xl border border-theme-border bg-theme-card p-12 text-center shadow-sm">
            <Key size={36} className="mx-auto text-theme-text-muted opacity-55" />
            <h3 className="text-sm font-bold text-theme-text mt-4">No active API keys</h3>
            <p className="text-xs text-theme-text-muted mt-1">Generate a key above to sync your Lead Growth integrations with third-party software.</p>
          </div>
        )}
      </div>
    </div>
  );
}
