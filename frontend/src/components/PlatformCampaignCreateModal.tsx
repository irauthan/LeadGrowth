import { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';
import { campaignService } from '../services/campaignService';
import type { AdAccountInfo, CreatePlatformCampaignRequest, MetaPageOption } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function PlatformCampaignCreateModal({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState<number>(1);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Platform Accounts & Pages data
  const [metaAccounts, setMetaAccounts] = useState<AdAccountInfo[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<AdAccountInfo[]>([]);

  // Form State
  const [platform, setPlatform] = useState<'Meta' | 'Google'>('Meta');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [selectedInstagramId, setSelectedInstagramId] = useState<string>('');
  
  // Campaign Configuration
  const [name, setName] = useState<string>('');
  const [objective, setObjective] = useState<string>('OUTCOME_LEADS');
  const [budget, setBudget] = useState<number>(50);
  const [status, setStatus] = useState<'PAUSED' | 'ACTIVE'>('PAUSED');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Placements & Targeting (Meta)
  const [placements, setPlacements] = useState<string[]>(['facebook', 'instagram']);
  const [targetCountries, setTargetCountries] = useState<string[]>(['US']);
  const [countryInput, setCountryInput] = useState<string>('');
  const [ageMin, setAgeMin] = useState<number>(21);
  const [ageMax, setAgeMax] = useState<number>(65);

  // Google specific
  const [biddingStrategy, setBiddingStrategy] = useState<string>('MAXIMIZE_CONVERSIONS');

  // Ad Creative & Copy
  const [adHeadline, setAdHeadline] = useState<string>('');
  const [adPrimaryText, setAdPrimaryText] = useState<string>('');
  const [adDestinationUrl, setAdDestinationUrl] = useState<string>('https://leadgrowth.io');
  const [callToAction, setCallToAction] = useState<string>('LEARN_MORE');

  useEffect(() => {
    if (isOpen) {
      loadAdAccounts();
      setStep(1);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const loadAdAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const [meta, google] = await Promise.all([
        campaignService.getConnectedAdAccounts('Meta'),
        campaignService.getConnectedAdAccounts('Google')
      ]);
      setMetaAccounts(meta);
      setGoogleAccounts(google);

      // Auto-select defaults
      if (meta.length > 0) {
        const defaultMeta = meta.find(a => a.isDefault) || meta[0];
        setSelectedAccountId(defaultMeta.accountId);
        if (defaultMeta.pages && defaultMeta.pages.length > 0) {
          setSelectedPageId(defaultMeta.pages[0].id);
          if (defaultMeta.pages[0].instagramAccounts && defaultMeta.pages[0].instagramAccounts.length > 0) {
            setSelectedInstagramId(defaultMeta.pages[0].instagramAccounts[0]);
          }
        }
      }
      if (google.length > 0 && meta.length === 0) {
        setPlatform('Google');
        const defaultGoogle = google.find(a => a.isDefault) || google[0];
        setSelectedAccountId(defaultGoogle.accountId);
      }
    } catch (err) {
      console.error('Failed to load connected ad accounts', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  if (!isOpen) return null;

  const currentAccounts = platform === 'Meta' ? metaAccounts : googleAccounts;
  const isPlatformConnected = currentAccounts.length > 0;
  const selectedAccount = currentAccounts.find(a => a.accountId === selectedAccountId) || currentAccounts[0];
  const pagesList: MetaPageOption[] = selectedAccount?.pages || [];

  const handlePlatformChange = (p: 'Meta' | 'Google') => {
    setPlatform(p);
    setErrorMessage(null);
    const accounts = p === 'Meta' ? metaAccounts : googleAccounts;
    if (accounts.length > 0) {
      const def = accounts.find(a => a.isDefault) || accounts[0];
      setSelectedAccountId(def.accountId);
      if (p === 'Meta') {
        setObjective('OUTCOME_LEADS');
        if (def.pages && def.pages.length > 0) {
          setSelectedPageId(def.pages[0].id);
        }
      } else {
        setObjective('SEARCH');
      }
    } else {
      setSelectedAccountId('');
    }
  };

  const togglePlacement = (placement: string) => {
    if (placements.includes(placement)) {
      if (placements.length > 1) {
        setPlacements(placements.filter(p => p !== placement));
      }
    } else {
      setPlacements([...placements, placement]);
    }
  };

  const handleAddCountry = () => {
    if (!countryInput.trim()) return;
    const c = countryInput.trim().toUpperCase();
    if (!targetCountries.includes(c)) {
      setTargetCountries([...targetCountries, c]);
    }
    setCountryInput('');
  };

  const handleRemoveCountry = (c: string) => {
    if (targetCountries.length > 1) {
      setTargetCountries(targetCountries.filter(item => item !== c));
    }
  };

  const handleNext = () => {
    setErrorMessage(null);
    if (step === 1 && !isPlatformConnected) {
      setErrorMessage(`No connected ${platform} advertising accounts found. Please configure credentials in the Integrations module first.`);
      return;
    }
    if (step === 2 && !selectedAccountId) {
      setErrorMessage('Please select a valid connected Ad Account.');
      return;
    }
    if (step === 3) {
      if (!name.trim()) {
        setErrorMessage('Please enter a campaign name.');
        return;
      }
      if (budget <= 0) {
        setErrorMessage('Daily budget must be greater than $0.');
        return;
      }
    }
    if (step === 4 && platform === 'Meta' && placements.length === 0) {
      setErrorMessage('Please select at least one placement (Facebook or Instagram).');
      return;
    }
    if (step === 5) {
      if (!adDestinationUrl.trim() || !adDestinationUrl.startsWith('http')) {
        setErrorMessage('Please enter a valid destination website URL (starting with http:// or https://).');
        return;
      }
    }
    setStep(s => Math.min(6, s + 1));
  };

  const handleBack = () => {
    setErrorMessage(null);
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmitDeploy = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const payload: CreatePlatformCampaignRequest = {
        platform,
        adAccountId: selectedAccountId,
        name: name.trim(),
        objective,
        budget: Number(budget),
        status,
        placements,
        pageId: platform === 'Meta' ? selectedPageId : undefined,
        instagramActorId: platform === 'Meta' && selectedInstagramId ? selectedInstagramId : undefined,
        targetCountries,
        ageMin,
        ageMax,
        adHeadline: adHeadline.trim() || name.trim(),
        adPrimaryText: adPrimaryText.trim() || name.trim(),
        adDestinationUrl: adDestinationUrl.trim(),
        callToAction,
        biddingStrategy: platform === 'Google' ? biddingStrategy : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const result = await campaignService.createPlatformCampaign(payload);
      if (result.success) {
        onCreated();
        onClose();
      } else {
        setErrorMessage(result.message || 'Failed to create campaign on platform.');
      }
    } catch (err: any) {
      console.error('Failed to create platform campaign', err);
      const msg = err.response?.data?.message || err.message || `Failed to create campaign on ${platform}. Please check API credentials and account permissions.`;
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsLabels = [
    'Platform',
    'Ad Account',
    'Campaign Setup',
    'Targeting',
    'Creative & Copy',
    'Review & Deploy'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl border border-theme-border/80 bg-theme-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Step Progress */}
        <div className="border-b border-theme-border/60 bg-theme-bg-alt/40 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-primary/10 text-theme-primary font-bold">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-theme-text flex items-center gap-2">
                  <span>Create Advertising Campaign</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-theme-primary/15 text-theme-primary font-semibold">
                    Live Platform API
                  </span>
                </h2>
                <p className="text-xs text-theme-text-muted">
                  Direct provisioning into Meta (Facebook & IG) or Google Ads
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-theme-text-muted hover:bg-theme-bg-alt hover:text-theme-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper bar */}
          <div className="mt-4 flex items-center justify-between gap-1">
            {stepsLabels.map((lbl, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < step;
              const isCurrent = stepNum === step;
              return (
                <div key={lbl} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-emerald-500' 
                        : isCurrent 
                          ? 'bg-theme-primary' 
                          : 'bg-theme-border/60'
                    }`}
                  />
                  <span className={`text-[10px] font-medium hidden sm:inline ${
                    isCurrent ? 'text-theme-primary font-bold' : 'text-theme-text-muted'
                  }`}>
                    {lbl}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-3 animate-fadeIn">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Deployment Attention Required</span>
                <p className="text-[11px] leading-relaxed text-theme-text-muted">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: PLATFORM SELECTION */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-theme-text">Select Advertising Provider</h3>
                <p className="text-xs text-theme-text-muted">Choose the connected ad network to deploy this campaign directly.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Meta Ads Card */}
                <div 
                  onClick={() => handlePlatformChange('Meta')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    platform === 'Meta' 
                      ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20' 
                      : 'border-theme-border bg-theme-bg-alt/30 hover:border-theme-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        Meta
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-theme-text">Meta Marketing API</h4>
                        <p className="text-[10px] text-theme-text-muted">Facebook, Instagram & Audience Network</p>
                      </div>
                    </div>
                    {platform === 'Meta' && (
                      <div className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] border-t border-theme-border/50 pt-2.5">
                    <span className="text-theme-text-muted font-medium">Connection Status:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${
                      metaAccounts.length > 0 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {metaAccounts.length > 0 ? `${metaAccounts.length} Account Connected` : 'Not Connected'}
                    </span>
                  </div>
                </div>

                {/* Google Ads Card */}
                <div 
                  onClick={() => handlePlatformChange('Google')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    platform === 'Google' 
                      ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20' 
                      : 'border-theme-border bg-theme-bg-alt/30 hover:border-theme-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        G
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-theme-text">Google Ads API</h4>
                        <p className="text-[10px] text-theme-text-muted">Search, Performance Max & Display</p>
                      </div>
                    </div>
                    {platform === 'Google' && (
                      <div className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] border-t border-theme-border/50 pt-2.5">
                    <span className="text-theme-text-muted font-medium">Connection Status:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${
                      googleAccounts.length > 0 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {googleAccounts.length > 0 ? `${googleAccounts.length} Account Connected` : 'Not Connected'}
                    </span>
                  </div>
                </div>
              </div>

              {!isPlatformConnected && (
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                    <HelpCircle size={15} />
                    <span>Connect {platform} Credentials to Continue</span>
                  </div>
                  <p className="text-[11px] text-theme-text-muted leading-relaxed">
                    LeadGrowth provisions real campaigns via live marketing APIs. Configure your {platform} OAuth tokens or API key in the Integrations hub.
                  </p>
                  <a
                    href="/integrations"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-theme-primary hover:underline pt-1"
                  >
                    <span>Go to Integrations Setup</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ACCOUNT & IDENTITY SELECTION */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-theme-text">Select Account & Identity</h3>
                <p className="text-xs text-theme-text-muted">Target ad account and associated brand identity.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-theme-text-muted">
                      Connected {platform} Ad Account
                    </label>
                    {loadingAccounts && (
                      <span className="flex items-center gap-1 text-[10px] text-theme-primary">
                        <Loader2 size={10} className="animate-spin" />
                        Fetching accounts...
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2.5 text-xs text-theme-text outline-none focus:border-theme-primary font-medium"
                  >
                    {currentAccounts.map(acc => (
                      <option key={acc.accountId} value={acc.accountId}>
                        {acc.accountName} ({acc.accountId}) — {acc.currency}
                      </option>
                    ))}
                  </select>
                </div>

                {platform === 'Meta' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                        Facebook Brand Page
                      </label>
                      {pagesList.length > 0 ? (
                        <select
                          value={selectedPageId}
                          onChange={(e) => setSelectedPageId(e.target.value)}
                          className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2.5 text-xs text-theme-text outline-none focus:border-theme-primary font-medium"
                        >
                          {pagesList.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Page ID: {p.id})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Facebook Page ID (e.g. 104829104820)"
                          value={selectedPageId}
                          onChange={(e) => setSelectedPageId(e.target.value)}
                          className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2.5 text-xs text-theme-text outline-none focus:border-theme-primary"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                        Instagram Account Identity (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Instagram Actor ID or username"
                        value={selectedInstagramId}
                        onChange={(e) => setSelectedInstagramId(e.target.value)}
                        className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2.5 text-xs text-theme-text outline-none focus:border-theme-primary"
                      />
                      <span className="text-[10px] text-theme-text-muted mt-1 block">
                        If left blank, Meta will use your Facebook Page identity for Instagram placements.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: CAMPAIGN DETAILS & BUDGET */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-theme-text">Campaign Objective & Budget</h3>
                <p className="text-xs text-theme-text-muted">Define campaign naming, primary objective, and daily spend limits.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 High-Value Real Estate Leads"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2.5 text-xs text-theme-text outline-none focus:border-theme-primary font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                      Objective / Campaign Type
                    </label>
                    <select
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2.5 text-xs text-theme-text outline-none focus:border-theme-primary font-medium"
                    >
                      {platform === 'Meta' ? (
                        <>
                          <option value="OUTCOME_LEADS">Lead Generation (Lead Ads / Forms)</option>
                          <option value="OUTCOME_SALES">Conversions & Sales</option>
                          <option value="OUTCOME_TRAFFIC">Website Traffic & Clicks</option>
                          <option value="OUTCOME_ENGAGEMENT">Messages & Engagement</option>
                        </>
                      ) : (
                        <>
                          <option value="SEARCH">Google Search Network</option>
                          <option value="PERFORMANCE_MAX">Performance Max (Multi-Channel)</option>
                          <option value="DISPLAY">Google Display Network</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                      Daily Budget ($ USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted text-xs font-bold">$</span>
                      <input
                        type="number"
                        min={5}
                        step="1"
                        value={budget}
                        onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2.5 pl-8 pr-3 text-xs text-theme-text outline-none focus:border-theme-primary font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                    Initial Platform Deployment Status
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setStatus('PAUSED')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        status === 'PAUSED'
                          ? 'border-amber-500 bg-amber-500/10 text-theme-text font-bold'
                          : 'border-theme-border bg-theme-bg-alt/40 text-theme-text-muted'
                      }`}
                    >
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Paused (Recommended)</div>
                      <div className="text-[10px] text-theme-text-muted mt-0.5">Deploy in draft to verify in Ads Manager</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus('ACTIVE')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        status === 'ACTIVE'
                          ? 'border-emerald-500 bg-emerald-500/10 text-theme-text font-bold'
                          : 'border-theme-border bg-theme-bg-alt/40 text-theme-text-muted'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Active (Live)</div>
                      <div className="text-[10px] text-theme-text-muted mt-0.5">Submit directly for platform ad review</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs text-theme-text outline-none focus:border-theme-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs text-theme-text outline-none focus:border-theme-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TARGETING & PLACEMENTS */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-theme-text">
                  {platform === 'Meta' ? 'Meta Placements & Demographics' : 'Google Targeting & Bidding'}
                </h3>
                <p className="text-xs text-theme-text-muted">Targeting configuration and placement channels.</p>
              </div>

              {platform === 'Meta' ? (
                <div className="space-y-4">
                  {/* Single unified Meta Placements */}
                  <div>
                    <label className="block text-xs font-semibold text-theme-text-muted mb-1.5">
                      Meta Advertising Placements (Facebook & Instagram)
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div 
                        onClick={() => togglePlacement('facebook')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          placements.includes('facebook')
                            ? 'border-blue-500 bg-blue-500/10 text-theme-text font-bold'
                            : 'border-theme-border bg-theme-bg-alt/30 text-theme-text-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">FB</span>
                          <span className="text-xs">Facebook Feeds & Stories</span>
                        </div>
                        {placements.includes('facebook') && <Check size={14} className="text-blue-500" />}
                      </div>

                      <div 
                        onClick={() => togglePlacement('instagram')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          placements.includes('instagram')
                            ? 'border-pink-500 bg-pink-500/10 text-theme-text font-bold'
                            : 'border-theme-border bg-theme-bg-alt/30 text-theme-text-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-lg bg-gradient-to-tr from-amber-500 to-pink-500 text-white flex items-center justify-center text-[10px] font-bold">IG</span>
                          <span className="text-xs">Instagram Feeds & Reels</span>
                        </div>
                        {placements.includes('instagram') && <Check size={14} className="text-pink-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Countries */}
                  <div>
                    <label className="block text-xs font-semibold text-theme-text-muted mb-1.5">
                      Target Countries (ISO Codes)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. US, IN, GB, CA"
                        value={countryInput}
                        onChange={(e) => setCountryInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCountry(); } }}
                        className="flex-1 rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs text-theme-text outline-none focus:border-theme-primary uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleAddCountry}
                        className="px-3.5 py-2 rounded-xl bg-theme-bg-alt border border-theme-border text-xs font-semibold text-theme-text hover:bg-theme-card"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {targetCountries.map(c => (
                        <span key={c} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-theme-primary/10 border border-theme-primary/20 text-theme-primary flex items-center gap-1.5">
                          <span>{c}</span>
                          <button type="button" onClick={() => handleRemoveCountry(c)} className="hover:text-rose-500">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Age range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-theme-text-muted mb-1">Min Age</label>
                      <input
                        type="number"
                        min={18}
                        max={65}
                        value={ageMin}
                        onChange={(e) => setAgeMin(parseInt(e.target.value) || 18)}
                        className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs text-theme-text outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-theme-text-muted mb-1">Max Age</label>
                      <input
                        type="number"
                        min={18}
                        max={65}
                        value={ageMax}
                        onChange={(e) => setAgeMax(parseInt(e.target.value) || 65)}
                        className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs text-theme-text outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                      Bidding Strategy
                    </label>
                    <select
                      value={biddingStrategy}
                      onChange={(e) => setBiddingStrategy(e.target.value)}
                      className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2.5 text-xs text-theme-text outline-none focus:border-theme-primary font-medium"
                    >
                      <option value="MAXIMIZE_CONVERSIONS">Maximize Conversions (Automated Smart Bidding)</option>
                      <option value="TARGET_CPA">Target CPA (Cost Per Acquisition)</option>
                      <option value="MANUAL_CPC">Manual CPC (Cost Per Click)</option>
                    </select>
                  </div>
                  <div className="p-3.5 rounded-xl border border-theme-border/60 bg-theme-bg-alt/40 text-xs text-theme-text-muted space-y-1">
                    <span className="font-semibold text-theme-text">Google Ads Network Placements:</span>
                    <p className="text-[11px]">Includes Google Search Engine, Search Partners, and Google Display Network automatically configured with standard delivery.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: CREATIVE & COPY */}
          {step === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-theme-text">Ad Copy & Landing Page</h3>
                <p className="text-xs text-theme-text-muted">Headlines, marketing message, and destination URL.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                    Ad Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern Cloud CRM Solutions for Fast Teams"
                    value={adHeadline}
                    onChange={(e) => setAdHeadline(e.target.value)}
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs text-theme-text outline-none focus:border-theme-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                    Primary Text / Ad Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Automate your sales pipeline, capture qualified inbound leads, and accelerate closed-won deals with LeadGrowth CRM."
                    value={adPrimaryText}
                    onChange={(e) => setAdPrimaryText(e.target.value)}
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs text-theme-text outline-none focus:border-theme-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                      Destination Website URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://yourcompany.com/landing"
                      value={adDestinationUrl}
                      onChange={(e) => setAdDestinationUrl(e.target.value)}
                      className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs text-theme-text outline-none focus:border-theme-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-text-muted mb-1">
                      Call To Action Button
                    </label>
                    <select
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      className="w-full rounded-xl border border-theme-border bg-theme-bg-alt px-3.5 py-2 text-xs text-theme-text outline-none focus:border-theme-primary font-medium"
                    >
                      <option value="LEARN_MORE">Learn More</option>
                      <option value="SIGN_UP">Sign Up</option>
                      <option value="APPLY_NOW">Apply Now</option>
                      <option value="GET_QUOTE">Get Quote</option>
                      <option value="CONTACT_US">Contact Us</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & DEPLOY */}
          {step === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-theme-text">Review & Deploy to Platform</h3>
                <p className="text-xs text-theme-text-muted">Verify all settings before provisioning into your advertising account.</p>
              </div>

              <div className="rounded-2xl border border-theme-border bg-theme-bg-alt/40 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-theme-text-muted uppercase font-bold block">Platform</span>
                    <span className="font-bold text-theme-text">{platform} Marketing API</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-text-muted uppercase font-bold block">Ad Account</span>
                    <span className="font-bold text-theme-text">{selectedAccountId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-text-muted uppercase font-bold block">Campaign Name</span>
                    <span className="font-bold text-theme-text">{name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-text-muted uppercase font-bold block">Daily Budget</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(budget)} / day</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-text-muted uppercase font-bold block">Objective</span>
                    <span className="font-bold text-theme-text">{objective}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-theme-text-muted uppercase font-bold block">Initial Status</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      status === 'ACTIVE' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                  {platform === 'Meta' && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-theme-text-muted uppercase font-bold block">Placements</span>
                      <span className="font-bold text-theme-text">{placements.join(', ').toUpperCase()}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-theme-border/60 pt-3">
                  <span className="text-[10px] text-theme-text-muted uppercase font-bold block">Ad Headline & Destination</span>
                  <p className="text-xs font-bold text-theme-text mt-0.5">{adHeadline || name}</p>
                  <p className="text-[11px] text-theme-primary truncate mt-0.5">{adDestinationUrl}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-theme-text space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={16} />
                  <span>Real-time API Guarantee</span>
                </div>
                <p className="text-[11px] text-theme-text-muted leading-relaxed">
                  Submitting will call the {platform} API directly. The resulting campaign ID will be persisted and linked for automatic daily metrics and lead synchronization.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="border-t border-theme-border/60 bg-theme-bg-alt/40 p-4 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-text hover:bg-theme-card transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-theme-text-muted hover:text-theme-text"
              >
                Cancel
              </button>
            )}
          </div>

          <div>
            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-white text-xs font-semibold transition-all shadow-xs"
              >
                <span>Continue</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitDeploy}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deploying to {platform}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Deploy Campaign to {platform}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
