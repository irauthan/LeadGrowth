import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import type { Campaign } from "../types";
import { formatCurrency, formatNumber } from "../utils";
import {
  Search,
  ArrowUpDown,
  Download,
  Plus,
  Loader2,
  LayoutGrid,
  Table as TableIcon,
  PauseCircle,
  PlayCircle,
  Layers,
  ChevronRight
} from "lucide-react";
import { downloadReport } from "../services/reportService";
import CampaignDetailView from "../components/CampaignDetailView";
import { campaignService } from "../services/campaignService";

export default function Campaigns() {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 'table' or 'grid'
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Selected campaign for full-page detail view
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<keyof Campaign>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === "grid" ? 6 : 10;

  // Create Campaign modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    platform: "Meta",
    status: "ACTIVE",
    budget: 0,
    spend: 0,
    clicks: 0,
    impressions: 0,
    conversions: 0,
    revenue: 0,
  });

  // Export menu state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // User Role Permissions
  const userRoles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = userRoles.includes("ROLE_ADMIN");
  const isManager = userRoles.includes("ROLE_MANAGER");
  const isUserOnly = userRoles.includes("ROLE_USER") && !isAdmin && !isManager;
  const canEdit = isAdmin || isManager;

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Sync URL search params
  useEffect(() => {
    const paramId = searchParams.get("id");
    const paramSearch = searchParams.get("search");

    if (paramSearch && paramSearch !== search) {
      setSearch(paramSearch);
    }

    if (paramId && campaigns.length > 0) {
      const targetId = parseInt(paramId, 10);
      if (!isNaN(targetId)) {
        setSelectedCampaignId(targetId);
      }
    }
  }, [searchParams, campaigns]);

  const fetchCampaigns = async () => {
    try {
      const endpoint = isUserOnly
        ? "/api/campaigns/user-view"
        : "/api/campaigns";
      const res = await api.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : [];
      setCampaigns(data);

      const paramId = searchParams.get("id");
      if (paramId && data.length > 0) {
        const targetId = parseInt(paramId, 10);
        if (!isNaN(targetId) && data.some(c => c.id === targetId)) {
          setSelectedCampaignId(targetId);
        }
      }
    } catch (e) {
      console.error("Error fetching campaigns", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/campaigns", createForm);
      setShowCreateModal(false);
      // Reset form
      setCreateForm({
        name: "",
        platform: "Meta",
        status: "ACTIVE",
        budget: 0,
        spend: 0,
        clicks: 0,
        impressions: 0,
        conversions: 0,
        revenue: 0,
      });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert("Failed to create campaign.");
    }
  };

  const handleQuickStatusChange = async (e: React.MouseEvent, id: number, currentStatus: string) => {
    e.stopPropagation();
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await campaignService.updateCampaignStatus(id, nextStatus);
      fetchCampaigns();
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  // Sorting Handler
  const requestSort = (key: keyof Campaign) => {
    let order: "asc" | "desc" = "asc";
    if (sortBy === key && sortOrder === "asc") {
      order = "desc";
    }
    setSortBy(key);
    setSortOrder(order);
  };

  // Export Handlers
  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      await downloadReport("campaigns", format);
    } catch (err) {
      console.error(err);
      alert(`Failed to export campaigns as ${format.toUpperCase()}.`);
    } finally {
      setShowExportMenu(false);
    }
  };

  // Aggregated KPIs
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue || 0), 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.leadsCount || 0), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);
  const activeCount = campaigns.filter(c => (c.status || "ACTIVE").toUpperCase() === "ACTIVE").length;
  const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Filtered & Sorted campaigns
  const filteredCampaigns = campaigns
    .filter((c) => {
      const matchesSearch = (c.name || "").toLowerCase().includes(search.toLowerCase());
      const matchesPlatform =
        platformFilter === "All" || (c.platform || "").toLowerCase() === platformFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "All" || (c.status || "ACTIVE").toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesPlatform && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";

      if (typeof valA === "string") {
        valA = (valA as string).toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination math
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampaigns.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  // If a campaign is selected, render the Full Screen Detail View!
  if (selectedCampaignId !== null) {
    return (
      <CampaignDetailView
        campaignId={selectedCampaignId}
        onBack={() => setSelectedCampaignId(null)}
        onUpdated={fetchCampaigns}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-theme-primary" />
        <span className="text-xs font-semibold text-theme-text-muted">Loading Campaigns...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-theme-text">
              Campaigns
            </h1>
            <span className="rounded-full bg-theme-bg-alt px-2.5 py-0.5 text-xs font-semibold text-theme-text-muted border border-theme-border">
              {campaigns.length} Total
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-theme-text-muted">
            Track ad spend, incoming leads, and return on ad spend.
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-theme-border bg-theme-card p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "grid"
                  ? "bg-theme-bg-alt text-theme-text font-semibold shadow-xs"
                  : "text-theme-text-muted hover:text-theme-text"
                }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "table"
                  ? "bg-theme-bg-alt text-theme-text font-semibold shadow-xs"
                  : "text-theme-text-muted hover:text-theme-text"
                }`}
              title="Table View"
            >
              <TableIcon size={14} />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Export triggers */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-theme-border bg-theme-card px-3.5 py-2 text-xs font-semibold hover:bg-theme-bg-alt text-theme-text transition-all"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-11 w-40 rounded-xl border border-theme-border bg-theme-card p-1 shadow-xl z-20 animate-fadeIn">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-theme-text hover:bg-theme-bg-alt"
                >
                  CSV Spreadsheet
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-theme-text hover:bg-theme-bg-alt"
                >
                  Excel Sheet (.xlsx)
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-theme-text hover:bg-theme-bg-alt"
                >
                  PDF Document (.pdf)
                </button>
              </div>
            )}
          </div>

          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover px-4 py-2 text-xs font-semibold text-white transition-all shadow-xs"
            >
              <Plus size={15} />
              <span>Create Campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean KPI Summary Bar (Minimalist & Professional) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
          <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
            Active Campaigns
          </span>
          <div className="text-xl font-bold text-theme-text">
            {activeCount} <span className="text-xs text-theme-text-muted font-normal">/ {campaigns.length}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
          <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
            Total Spend
          </span>
          <div className="text-xl font-bold text-theme-text">
            {formatCurrency(totalSpend)}
          </div>
        </div>

        <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
          <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
            Total Leads
          </span>
          <div className="text-xl font-bold text-theme-primary">
            {formatNumber(totalLeads)}
          </div>
        </div>

        <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1">
          <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
            Conversions
          </span>
          <div className="text-xl font-bold text-theme-text">
            {formatNumber(totalConversions)}
          </div>
        </div>

        <div className="rounded-2xl border border-theme-border bg-theme-card p-4 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-theme-text-muted uppercase tracking-wider block">
            Revenue / ROAS
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-theme-text-muted font-medium">
            ROAS: <strong className="text-emerald-600 dark:text-emerald-400">{overallRoas.toFixed(2)}x</strong>
          </div>
        </div>
      </div>

      {/* Filters block */}
      <div className="flex flex-col gap-3 rounded-2xl border border-theme-border bg-theme-card p-3 sm:p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute inset-y-0 left-3 my-auto text-theme-text-muted" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 pl-9 pr-3 text-xs outline-none focus:border-theme-primary text-theme-text"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-theme-text-muted">Platform:</span>
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs outline-none text-theme-text focus:border-theme-primary font-medium"
            >
              <option value="All">All Platforms</option>
              <option value="Meta">Meta</option>
              <option value="Google">Google</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="TikTok">TikTok</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-theme-text-muted">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-theme-border bg-theme-bg-alt px-3 py-1.5 text-xs outline-none text-theme-text focus:border-theme-primary font-medium"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: CLEAN CARDS GRID */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((c: Campaign) => {
            const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0.0;
            const roas = c.spend && c.spend > 0 ? c.revenue / c.spend : 0.0;
            const isActive = (c.status || "ACTIVE").toUpperCase() === "ACTIVE";
            const isPaused = (c.status || "").toUpperCase() === "PAUSED";

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCampaignId(c.id)}
                className="group flex flex-col justify-between rounded-2xl border border-theme-border bg-theme-card p-5 hover:border-theme-primary/50 hover:shadow-md transition-all cursor-pointer space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-theme-bg-alt border border-theme-border text-theme-text">
                        {c.platform}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${isActive
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : isPaused
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-slate-500/10 border-slate-500/20 text-slate-500"
                        }`}>
                        {c.status || "ACTIVE"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-theme-text group-hover:text-theme-primary transition-colors line-clamp-1">
                      {c.name}
                    </h3>
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickStatusChange(e, c.id, c.status || "ACTIVE")}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${isActive
                          ? "text-amber-500 hover:bg-amber-500/10"
                          : "text-emerald-500 hover:bg-emerald-500/10"
                        }`}
                      title={isActive ? "Pause Campaign" : "Activate Campaign"}
                    >
                      {isActive ? <PauseCircle size={17} /> : <PlayCircle size={17} />}
                    </button>
                  )}
                </div>

                {/* Metrics 3-box Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-theme-border/60">
                  <div className="rounded-xl bg-theme-bg-alt/40 p-2.5 space-y-0.5">
                    <span className="text-[10px] text-theme-text-muted font-medium uppercase block">Spend</span>
                    <span className="text-sm font-bold text-theme-text">{formatCurrency(c.spend || 0)}</span>
                  </div>

                  <div className="rounded-xl bg-theme-bg-alt/40 p-2.5 space-y-0.5">
                    <span className="text-[10px] text-theme-text-muted font-medium uppercase block">Leads</span>
                    <span className="text-sm font-bold text-theme-primary">{formatNumber(c.leadsCount || 0)}</span>
                  </div>

                  <div className="rounded-xl bg-theme-bg-alt/40 p-2.5 space-y-0.5">
                    <span className="text-[10px] text-theme-text-muted font-medium uppercase block">ROAS</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{roas.toFixed(1)}x</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-theme-border/60 flex items-center justify-between text-xs text-theme-text-muted">
                  <span>{formatNumber(c.clicks || 0)} clicks ({ctr.toFixed(1)}% CTR)</span>
                  <span className="flex items-center gap-1 font-semibold text-theme-primary group-hover:translate-x-0.5 transition-transform">
                    <span>View</span>
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}

          {filteredCampaigns.length === 0 && (
            <div className="col-span-full py-16 text-center rounded-2xl border border-theme-border bg-theme-card">
              <Layers size={32} className="mx-auto mb-2 text-theme-text-muted" />
              <p className="text-sm font-semibold text-theme-text">No campaigns found.</p>
              <p className="text-xs text-theme-text-muted mt-1">
                Try adjusting your search criteria or create a new campaign.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CLEAN TABLE VIEW */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border border-theme-border bg-theme-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full table-auto text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-theme-border bg-theme-bg-alt font-semibold text-theme-text-muted">
                  <th
                    onClick={() => requestSort("name")}
                    className="cursor-pointer py-3.5 pl-5 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Campaign Name</span>
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th className="px-3 py-3.5">Platform</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5">Impressions</th>
                  <th className="px-3 py-3.5">Clicks</th>
                  <th className="px-3 py-3.5">CTR</th>
                  <th className="px-3 py-3.5">Leads</th>
                  <th className="px-3 py-3.5">Conversions</th>
                  <th className="px-3 py-3.5">Spend</th>
                  <th className="px-3 py-3.5">Revenue</th>
                  <th className="px-3 py-3.5">ROAS</th>
                  <th className="py-3.5 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/50">
                {currentItems.map((c: any) => {
                  const ctr =
                    c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0.0;
                  const roas = c.spend && c.spend > 0 ? c.revenue / c.spend : 0.0;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCampaignId(c.id)}
                      className="hover:bg-theme-bg-alt/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 pl-5 font-semibold text-theme-text group-hover:text-theme-primary transition-colors">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-medium bg-theme-bg-alt border border-theme-border text-theme-text">
                          {c.platform}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${(c.status || "ACTIVE").toUpperCase() === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}>
                          {c.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-theme-text-muted">
                        {formatNumber(c.impressions)}
                      </td>
                      <td className="py-3.5 px-3 text-theme-text-muted">
                        {formatNumber(c.clicks)}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-theme-text">
                        {ctr.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-3 font-bold text-theme-primary">
                        {c.leadsCount || 0}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-theme-text">
                        {c.conversions || 0}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-theme-text">
                        {formatCurrency(c.spend || 0)}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(c.revenue || 0)}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-theme-text">
                        {roas.toFixed(2)}x
                      </td>
                      <td className="py-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedCampaignId(c.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold border border-theme-border hover:bg-theme-bg-alt text-theme-text transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredCampaigns.length === 0 && (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-12 text-center text-theme-text-muted font-medium"
                    >
                      No campaigns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between pt-2">
          <span className="text-xs text-theme-text-muted">
            Showing {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredCampaigns.length)} of{" "}
            {filteredCampaigns.length} campaigns
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="rounded-lg border border-theme-border bg-theme-card px-3 py-1 text-xs font-medium hover:bg-theme-bg-alt disabled:opacity-40 text-theme-text"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="rounded-lg border border-theme-border bg-theme-card px-3 py-1 text-xs font-medium hover:bg-theme-bg-alt disabled:opacity-40 text-theme-text"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-theme-card border border-theme-border p-6 shadow-xl">
            <h3 className="text-lg font-bold text-theme-text">
              Create Campaign
            </h3>
            <p className="text-xs text-theme-text-muted mb-4">
              Set up a campaign to track leads and ad metrics.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meta Lead Generation - Q3"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3.5 text-xs sm:text-sm outline-none focus:border-theme-primary text-theme-text font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                    Platform
                  </label>
                  <select
                    value={createForm.platform}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, platform: e.target.value })
                    }
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs outline-none focus:border-theme-primary text-theme-text"
                  >
                    <option value="Meta">Meta (FB & IG)</option>
                    <option value="Google">Google Ads</option>
                    <option value="LinkedIn">LinkedIn Ads</option>
                    <option value="TikTok">TikTok Ads</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                    Status
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, status: e.target.value })
                    }
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3 text-xs outline-none focus:border-theme-primary text-theme-text"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="5000"
                    value={createForm.budget}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        budget: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3.5 text-xs outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                    Initial Spend ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="1200"
                    value={createForm.spend}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        spend: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3.5 text-xs outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                    Impressions
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.impressions}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        impressions: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3.5 text-xs outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                    Clicks
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.clicks}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        clicks: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3.5 text-xs outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                    Conversions
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.conversions}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        conversions: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3.5 text-xs outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-theme-text-muted">
                    Generated Revenue ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={createForm.revenue}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        revenue: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-theme-border bg-theme-bg-alt py-2 px-3.5 text-xs outline-none focus:border-theme-primary text-theme-text font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-theme-border/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-theme-border bg-theme-bg-alt px-4 py-2 text-xs font-semibold text-theme-text-muted hover:bg-theme-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-theme-primary hover:bg-theme-primary-hover px-4 py-2 text-xs font-semibold text-white transition-all"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
