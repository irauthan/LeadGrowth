import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Integration, SyncLog } from '../types';
import { formatDate } from '../utils';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Database,
  Key,
  Layers,
  Globe,
  Loader2
} from 'lucide-react';

export default function Integrations() {
  const user = useAuthStore((state) => state.user);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Forms
  const [metaKey, setMetaKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');

  const isAdmin = user?.roles.includes('ROLE_ADMIN');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [intRes, logsRes] = await Promise.all([
        api.get('/api/integrations'),
        api.get('/api/integrations/sync-logs'),
      ]);
      setIntegrations(intRes.data);
      setLogs(logsRes.data);

      const meta = intRes.data.find((i: any) => i.platform.toLowerCase() === 'meta');
      const google = intRes.data.find((i: any) => i.platform.toLowerCase() === 'google');
      if (meta?.apiKey) setMetaKey(meta.apiKey);
      if (google?.apiKey) setGoogleKey(google.apiKey);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: 'Meta' | 'Google', key: string) => {
    try {
      await api.post(`/api/integrations/connect?platform=${platform}&apiKey=${key}`);
      fetchData();
      alert(`${platform} integration API key connected successfully.`);
    } catch (e) {
      console.error(e);
      alert('Failed to connect API key.');
    }
  };

  const handleManualSync = async (platform: 'Meta' | 'Google') => {
    setSyncing(platform);
    try {
      await api.post(`/api/integrations/sync?platform=${platform}`);
      await fetchData();
      alert(`${platform} ads simulation manual data sync triggered successfully.`);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.message || `Failed to sync ${platform}. Make sure integration is connected.`);
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 size={36} className="animate-spin text-brand-500" />
      </div>
    );
  }

  const isMetaConnected = integrations.some(i => i.platform.toLowerCase() === 'meta' && i.status === 'Connected');
  const isGoogleConnected = integrations.some(i => i.platform.toLowerCase() === 'google' && i.status === 'Connected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-sans">Integrations</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Connect marketing channel API credentials to sync spend, clicks, impressions, and live leads.
        </p>
      </div>

      {/* API Key Connectors Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Meta Connector */}
        <div className="glass-card rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-md">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Meta Marketing Connector</h3>
                  <p className="text-xs text-slate-400">Facebook & Instagram Campaign Sync</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isMetaConnected ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}>
                {isMetaConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <p className="mt-5 text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Acquires Facebook Ads manager impressions, budget spent, qualified conversions, and spawns WebSocket leads dynamically on sync.
            </p>

            <div className="mt-6 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">API Access Token</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <Key size={16} />
                </span>
                <input
                  type="password"
                  placeholder="meta_marketing_api_token_..."
                  value={metaKey}
                  onChange={(e) => setMetaKey(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-brand-500 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            {isAdmin && (
              <button
                onClick={() => handleConnect('Meta', metaKey)}
                className="rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-brand-700"
              >
                Save Credentials
              </button>
            )}
            <button
              onClick={() => handleManualSync('Meta')}
              disabled={!isMetaConnected || syncing !== null}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900"
            >
              {syncing === 'Meta' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Manual Sync</span>
            </button>
          </div>
        </div>

        {/* Google Connector */}
        <div className="glass-card rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Google Ads Connector</h3>
                  <p className="text-xs text-slate-400">Google Search & Display Network Sync</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isGoogleConnected ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}>
                {isGoogleConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <p className="mt-5 text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Syncs Search campaigns CPC spend, clicks count, and impressions. Automatically runs simulation cron loops hourly.
            </p>

            <div className="mt-6 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Developer API Key</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  <Key size={16} />
                </span>
                <input
                  type="password"
                  placeholder="google_developer_token_..."
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-brand-500 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            {isAdmin && (
              <button
                onClick={() => handleConnect('Google', googleKey)}
                className="rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-brand-700"
              >
                Save Credentials
              </button>
            )}
            <button
              onClick={() => handleManualSync('Google')}
              disabled={!isGoogleConnected || syncing !== null}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900"
            >
              {syncing === 'Google' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Manual Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync logs timeline console */}
      <div className="glass-card rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-slate-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Sync Engine Status Monitor</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">Logs of hourly and manual simulation cron triggers</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 dark:border-slate-800 pb-3">
                <th className="pb-3">Platform</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs md:text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                  <td className="py-3.5 font-bold">{log.platform}</td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      log.status === 'Success' ? 'bg-green-100 text-green-700 dark:bg-green-950/30' : 'bg-red-100 text-red-700 dark:bg-red-950/30'
                    }`}>
                      {log.status === 'Success' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-400">{formatDate(log.createdAt)}</td>
                  <td className="py-3.5 max-w-sm truncate text-slate-500 dark:text-slate-400" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-400">No sync tasks executed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
