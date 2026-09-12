import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  Activity,
  Download,
  Plus,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Scale,
  Check,
  MapPin,
  Landmark,
  WalletCards,
} from "lucide-react";
import { usePartners } from "../hooks/usePartners";
import { supabase } from "../lib/supabase";
import IndustrialCard from "../components/ui/IndustrialCard";
import TactileButton from "../components/ui/TactileButton";
import LedIndicator from "../components/ui/LedIndicator";

export default function AdminPartnersPage() {
  const { i18n } = useTranslation();
  const ui = (english, hindi) =>
    i18n.language?.startsWith("hi") ? hindi : english;
  const { partners: fetchedPartners, loading, addPartner } = usePartners();  const [overrideMap, setOverrideMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'SCA' | 'PSB' | 'RRB'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [newPartner, setNewPartner] = useState({
    name: "",
    type: "SCA",
    state: "Uttar Pradesh",
    budgetCap: "25",
    schemes: ["term_loan", "micro_finance"],
  });

  // Derive partners from fetched database rows merged with any local optimistic overrides
  const partners = useMemo(() => {
    return (fetchedPartners || []).map((p) => {
      const dbEligible =
        p.is_eligible !== undefined
          ? Boolean(p.is_eligible)
          : Boolean(p.isEligible);
      const isEligible =
        overrideMap[p.id] !== undefined ? overrideMap[p.id] : dbEligible;

      const name = p.name || "Channel Partner";
      const shortName = p.short_name || p.shortName || name;
      const badge =
        p.badge || (shortName || name || "CP").slice(0, 3).toUpperCase();
      const type = (p.partner_type || p.type || "SCA").toUpperCase();
      const typeBadge = p.type_badge || p.typeBadge || type;
      const code =
        p.partner_code ||
        p.code ||
        `CP-${String(p.id).slice(0, 4).toUpperCase()}`;
      const state = p.state || "Uttar Pradesh";
      const location = p.location || p.address || "District Office";

      let schemes = ["Term Loan", "Micro Finance", "Mahila Samriddhi"];
      if (Array.isArray(p.schemes) && p.schemes.length > 0) {
        schemes = p.schemes;
      } else if (
        Array.isArray(p.accepted_scheme_types) &&
        p.accepted_scheme_types.length > 0
      ) {
        schemes = p.accepted_scheme_types.map((t) =>
          typeof t === "string"
            ? t
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
            : String(t),
        );
      }

      return {
        ...p,
        id: p.id,
        name,
        shortName,
        badge,
        type,
        typeBadge,
        code,
        state,
        location,
        schemes,
        budgetCap: Number(p.budget_cap ?? p.budgetCap ?? 50.0),
        budgetAllocated: Number(
          p.budget_allocated ?? p.budgetAllocated ?? 40.0,
        ),
        utilizationPct: Number(p.utilization_pct ?? p.utilizationPct ?? 80.0),
        npaRatio: Number(p.npa_ratio ?? p.npaRatio ?? 3.5),
        isEligible,
        is_eligible: isEligible,
      };
    });
  }, [fetchedPartners, overrideMap]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handle toggling eligibility with optimistic local update and revert on error
  const handleToggleEligibility = async (partner) => {
    const previousValue = Boolean(partner.isEligible ?? partner.is_eligible);
    const newValue = !previousValue;
    const partnerId = partner.id;
    const partnerName = partner.shortName || partner.name || "Partner";

    // 1. Optimistically update local state first
    setOverrideMap((prev) => ({
      ...prev,
      [partnerId]: newValue,
    }));

    showToast(
      newValue
        ? `Applicant routing enabled for ${partnerName}`
        : `Traffic routing paused for ${partnerName}`,
    );

    // 2. Perform backend update via supabase
    try {
      const { error } = await supabase
        .from("channel_partners")
        .update({ is_eligible: newValue })
        .eq("id", partner.id);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Failed to update partner eligibility in Supabase:", err);
      // 3. Revert on error
      setOverrideMap((prev) => ({
        ...prev,
        [partnerId]: previousValue,
      }));
      showToast(`Error updating status for ${partnerName}. Changes reverted.`);
    }
  };

  // Filtered partners based on search and type chip
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (filterType !== "all" && p.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchShort = p.shortName.toLowerCase().includes(q);
        const matchState = p.state.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchType = p.type.toLowerCase().includes(q);
        if (
          !matchName &&
          !matchShort &&
          !matchState &&
          !matchCode &&
          !matchType
        ) {
          return false;
        }
      }
      return true;
    });
  }, [partners, filterType, searchQuery]);

  // Aggregate active counts
  const activeCount = partners.filter((p) => p.isEligible).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Desk Context Banner */}
      <IndustrialCard
        variant="panel"
        className="py-2.5 px-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 font-mono text-xs text-industrial-ink-light">
          <ShieldCheck className="w-4 h-4 text-industrial-accent" />
          <span className="uppercase tracking-wider font-bold text-industrial-ink">
            {ui("Governance Portal", "शासन पोर्टल")}
          </span>
          <span className="text-industrial-border">/</span>
          <span className="text-industrial-ink font-bold">
            Desk Audit & Partner Management
          </span>
          <span className="bg-industrial-recessed text-industrial-ink font-mono text-[10px] px-2 py-0.5 rounded border border-industrial-border shadow-xs">
            Q3 REVIEW CYCLE
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-industrial-ink-light flex-wrap">
          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <LedIndicator color="emerald" state="blinking" size="sm" />
            SYNCHRONIZED: TODAY 11:42 IST
          </span>
          <span className="text-industrial-border">|</span>
          <span>
            Authorized Desk:{" "}
            <strong className="text-industrial-ink">
              S. Venkatachalam (Director, Credit)
            </strong>
          </span>
        </div>
      </IndustrialCard>

      {/* Screen Title Header with Official Badging */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-3xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-industrial-recessed border border-industrial-border shadow-recessed text-industrial-ink font-mono text-[11px] tracking-wider uppercase font-bold">
            <Building2 className="w-3.5 h-3.5 text-industrial-accent" />
            MoSJE Financial Intermediary Oversight
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-industrial-ink">
            {ui("Channel Partner Governance", "चैनल साझेदार प्रबंधन")}{" "}
            <span className="text-base sm:text-lg font-sans text-industrial-ink-muted font-normal">
              / चैनल पार्टनर प्रबंधन
            </span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-industrial-ink-light">
            Monitor State Channelising Agencies (SCAs), Public Sector Banks
            (PSBs), and RRBs under MoSJE Credit Directives.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-end flex-wrap">
          <TactileButton
            variant="secondary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={() =>
              showToast(
                "Generating MoSJE Partner Compliance Ledger (CSV & Signed PDF)...",
              )
            }
          >
            Export Regulatory Report
          </TactileButton>
          <TactileButton
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            {ui("Add Channel Partner", "नया चैनल साझेदार")}
          </TactileButton>
        </div>
      </div>

      {/* Administrative KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Active Partners */}
        <IndustrialCard
          variant="panel"
          cornerScrews
          className="p-4 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] text-industrial-ink-muted uppercase tracking-wider block">
                Total Active Partners
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-industrial-ink mt-1 leading-none">
                {activeCount}{" "}
                <span className="text-lg font-normal text-industrial-ink-muted">
                  / {partners.length}
                </span>
              </div>
              <span className="font-sans text-xs text-industrial-ink-light mt-1 block">
                84 Accredited Nationally
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed flex items-center justify-center text-industrial-ink">
              <Landmark className="w-5 h-5 text-industrial-accent" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-industrial-border/60 flex items-center gap-2 font-mono text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Onboarded via PFMS</span>
          </div>
        </IndustrialCard>

        {/* Card 2: Total Funds Allocated */}
        <IndustrialCard
          variant="panel"
          cornerScrews
          className="p-4 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] text-industrial-ink-muted uppercase tracking-wider block">
                Total Funds Allocated
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-industrial-ink mt-1 leading-none">
                ₹420.50
                <span className="text-sm font-normal text-industrial-ink-muted ml-1 font-mono">
                  Cr
                </span>
              </div>
              <span className="font-sans text-xs text-industrial-ink-light mt-1 block">
                FY 2024–25 Sanctioned Cap
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed flex items-center justify-center text-industrial-ink">
              <WalletCards className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-industrial-border/60 flex items-center gap-2 font-mono text-xs text-industrial-ink-light">
            <span className="font-bold text-industrial-ink">₹367.51 Cr</span>{" "}
            disbursed to accounts
          </div>
        </IndustrialCard>

        {/* Card 3: Avg Fund Utilization */}
        <IndustrialCard
          variant="panel"
          cornerScrews
          className="p-4 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] text-industrial-ink-muted uppercase tracking-wider block">
                Avg Fund Utilization
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-industrial-ink mt-1 leading-none">
                87.4%
              </div>
              <span className="font-sans text-xs text-industrial-ink-light mt-1 block">
                Benchmark target: ≥80%
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed flex items-center justify-center text-industrial-ink">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-industrial-border/60 flex items-center gap-2">
            <div className="w-full bg-industrial-recessed h-2 rounded-full overflow-hidden border border-industrial-border/80 shadow-recessed">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                style={{ width: "87.4%" }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-emerald-600">
              +4.2%
            </span>
          </div>
        </IndustrialCard>

        {/* Card 4: Portfolio Health (NPA) */}
        <IndustrialCard
          variant="panel"
          cornerScrews
          className="p-4 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] text-industrial-ink-muted uppercase tracking-wider block">
                Portfolio Health (NPA)
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-industrial-ink mt-1 leading-none">
                3.8%
              </div>
              <span className="font-sans text-xs text-industrial-ink-light mt-1 block">
                Gross Non-Performing Ratio
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed flex items-center justify-center text-industrial-ink">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-industrial-border/60 flex items-center gap-2 font-mono text-xs text-industrial-ink-light">
            <LedIndicator color="emerald" state="on" size="sm" />
            <span>Ceiling Limit: 5.0%</span>
          </div>
        </IndustrialCard>
      </div>

      {/* Institutional Safeguard Context Strip */}
      <IndustrialCard variant="panel" className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8 flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
            <div className="w-12 h-12 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed text-industrial-ink flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <div className="font-mono text-xs font-bold text-industrial-ink uppercase tracking-wider">
                Direct Beneficiary Transfer (DBT) Safeguard Protocol Active
              </div>
              <p className="font-sans text-xs text-industrial-ink-light">
                Partners breaching the 5.0% Gross NPA threshold trigger
                automated routing restrictions on concessional micro-credit
                products. Desk audits require direct sign-off before fiscal
                limits can be reassigned.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5 font-mono text-[10px]">
                <span className="bg-industrial-recessed border border-industrial-border px-2 py-0.5 rounded font-bold text-industrial-ink">
                  NSFDC Mandate
                </span>
                <span className="bg-industrial-recessed border border-industrial-border px-2 py-0.5 rounded font-bold text-industrial-ink">
                  NBCFDC Directives
                </span>
                <span className="bg-industrial-recessed border border-industrial-border px-2 py-0.5 rounded font-bold text-industrial-ink">
                  RBI Priority Sector Norms
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center bg-industrial-recessed p-3 rounded-lg border border-industrial-border shadow-recessed">
            <span className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted">
              Dynamic Routing Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <LedIndicator color="emerald" state="blinking" size="sm" />
              <span className="font-mono text-xs font-bold text-industrial-ink uppercase">
                Algorithmic Load Balancing Live
              </span>
            </div>
            <span className="font-mono text-[11px] text-industrial-ink-light mt-0.5">
              Routing applicants across {activeCount} eligible channel desks
            </span>
          </div>
        </div>
      </IndustrialCard>

      {/* Table Management Bar: Filters, Search, Batch Control */}
      <IndustrialCard
        variant="panel"
        cornerScrews
        className="p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-industrial-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed font-mono text-xs text-industrial-ink placeholder:text-industrial-ink-muted focus:outline-none focus:border-industrial-accent"
              placeholder="Search by partner name, nodal state, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tactical Rocker Filter Switch & Batch Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-lg bg-industrial-recessed p-1 border border-industrial-border shadow-recessed">
              <button
                className={`px-3 py-1 rounded font-mono text-xs transition-all duration-150 cursor-pointer ${
                  filterType === "all"
                    ? "bg-industrial-chassis text-industrial-ink shadow-pressed border border-industrial-border/60 font-bold translate-y-[1px]"
                    : "text-industrial-ink-muted hover:text-industrial-ink"
                }`}
                onClick={() => setFilterType("all")}
                type="button"
              >
                {ui("All Types", "सभी प्रकार")} ({partners.length})
              </button>
              <button
                className={`px-3 py-1 rounded font-mono text-xs transition-all duration-150 cursor-pointer ${
                  filterType === "SCA"
                    ? "bg-industrial-chassis text-industrial-ink shadow-pressed border border-industrial-border/60 font-bold translate-y-[1px]"
                    : "text-industrial-ink-muted hover:text-industrial-ink"
                }`}
                onClick={() => setFilterType("SCA")}
                type="button"
              >
                SCAs ({partners.filter((p) => p.type === "SCA").length})
              </button>
              <button
                className={`px-3 py-1 rounded font-mono text-xs transition-all duration-150 cursor-pointer ${
                  filterType === "PSB"
                    ? "bg-industrial-chassis text-industrial-ink shadow-pressed border border-industrial-border/60 font-bold translate-y-[1px]"
                    : "text-industrial-ink-muted hover:text-industrial-ink"
                }`}
                onClick={() => setFilterType("PSB")}
                type="button"
              >
                PSBs ({partners.filter((p) => p.type === "PSB").length})
              </button>
              <button
                className={`px-3 py-1 rounded font-mono text-xs transition-all duration-150 cursor-pointer ${
                  filterType === "RRB"
                    ? "bg-industrial-chassis text-industrial-ink shadow-pressed border border-industrial-border/60 font-bold translate-y-[1px]"
                    : "text-industrial-ink-muted hover:text-industrial-ink"
                }`}
                onClick={() => setFilterType("RRB")}
                type="button"
              >
                RRBs ({partners.filter((p) => p.type === "RRB").length})
              </button>
            </div>

            <TactileButton
              variant="secondary"
              size="sm"
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              onClick={() =>
                showToast(
                  "Batch audit verification requested for all active channel partners.",
                )
              }
            >
              Batch Thresholds
            </TactileButton>
          </div>
        </div>

        {/* Industrial Rack Directory Table */}
        <div className="overflow-x-auto rounded-lg border border-industrial-border shadow-recessed bg-industrial-recessed/40">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-industrial-chassis border-b border-industrial-border font-mono text-[11px] text-industrial-ink-muted uppercase tracking-wider">
                <th className="py-3 px-4">Partner Name & State</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Allocated Budget & Util. %</th>
                <th className="py-3 px-4">Gross NPA (Audit)</th>
                <th className="py-3 px-4">Schemes Handled</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Applicant Routing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border/60 bg-industrial-panel">
              {loading && partners.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-industrial-ink-muted font-mono"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-industrial-accent border-t-transparent rounded-full animate-spin" />
                      <span>
                        Loading channel partner governance directory...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-industrial-ink-muted font-mono"
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>
                      No channel partners found matching the selected criteria.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => {
                  const isBreached = partner.npaRatio > 5.0;

                  return (
                    <tr
                      key={partner.id}
                      className="hover:bg-industrial-chassis/40 transition-colors"
                    >
                      {/* Col 1: Partner Name & State */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-industrial-recessed border border-industrial-border shadow-recessed flex items-center justify-center font-mono font-bold text-xs text-industrial-ink shrink-0">
                            {partner.badge}
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-bold text-industrial-ink truncate">
                              {partner.name}
                            </div>
                            <div className="font-sans text-[11px] text-industrial-ink-light flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-industrial-ink-muted" />
                              <span>
                                {partner.location} •{" "}
                                <span className="font-mono">
                                  {partner.code}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Partner Type */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-industrial-recessed border border-industrial-border text-industrial-ink">
                          {partner.type}
                        </span>
                      </td>

                      {/* Col 3: Allocated Budget & Util. % */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="w-44 space-y-1">
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="font-bold text-industrial-ink">
                              ₹{partner.budgetAllocated.toFixed(2)} Cr
                            </span>
                            <span
                              className={`font-bold ${
                                partner.utilizationPct >= 80
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {partner.utilizationPct}%
                            </span>
                          </div>
                          <div className="w-full bg-industrial-recessed h-1.5 rounded-full overflow-hidden border border-industrial-border/60">
                            <div
                              className={`h-full rounded-full ${
                                partner.utilizationPct >= 80
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${partner.utilizationPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-industrial-ink-muted block">
                            Cap: ₹{partner.budgetCap.toFixed(2)} Cr (Lock)
                          </span>
                        </div>
                      </td>

                      {/* Col 4: Gross NPA Ratio (Desk Audit) */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div
                            className={`px-2.5 py-1 rounded font-mono text-xs font-bold border ${
                              isBreached
                                ? "bg-red-500/10 text-red-700 border-red-500/30"
                                : "bg-industrial-recessed text-industrial-ink border-industrial-border shadow-recessed"
                            }`}
                            title="Read-only statutory desk audit metric"
                          >
                            {partner.npaRatio.toFixed(1)}%
                          </div>
                          {isBreached ? (
                            <AlertTriangle
                              className="w-4 h-4 text-red-600 shrink-0"
                              title="NPA Breached 5% Cap Limit"
                            />
                          ) : (
                            <CheckCircle2
                              className="w-4 h-4 text-emerald-600 shrink-0"
                              title="Within Permissible Bounds"
                            />
                          )}
                        </div>
                      </td>

                      {/* Col 5: Schemes Handled */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-wrap gap-1 max-w-xs font-mono text-[10px]">
                          {partner.schemes.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-industrial-chassis border border-industrial-border text-industrial-ink-light whitespace-nowrap"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Col 6: Eligibility Status */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                          <LedIndicator
                            color={partner.isEligible ? "emerald" : "ruby"}
                            state={partner.isEligible ? "on" : "off"}
                            size="sm"
                          />
                          <span
                            className={
                              partner.isEligible
                                ? "text-emerald-700"
                                : "text-red-700"
                            }
                          >
                            {partner.isEligible ? "Active" : "Capped"}
                          </span>
                        </div>
                      </td>

                      {/* Col 7: Industrial Physical Rocker Switch */}
                      <td className="py-3.5 px-4 align-middle text-center">
                        <label className="relative inline-flex items-center cursor-pointer select-none group">
                          <input
                            checked={Boolean(
                              partner.isEligible ?? partner.is_eligible,
                            )}
                            className="sr-only peer"
                            type="checkbox"
                            onChange={() => handleToggleEligibility(partner)}
                          />
                          <div className="w-12 h-6 bg-industrial-recessed rounded-full border border-industrial-border shadow-recessed peer-checked:bg-emerald-600/20 peer-checked:border-emerald-500/40 transition-all duration-200">
                            <div
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-industrial-panel border border-industrial-border shadow-card transition-all duration-200 flex items-center justify-center ${
                                (partner.isEligible ?? partner.is_eligible)
                                  ? "translate-x-6 bg-emerald-600 border-emerald-700 text-white"
                                  : "text-industrial-ink-muted"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            </div>
                          </div>
                        </label>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Desk Footnote */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 font-mono text-xs text-industrial-ink-light">
          <div>
            Showing <strong>{filteredPartners.length}</strong> of{" "}
            <strong>{partners.length}</strong> channel partner institutions //
            Mandate Sec 14(1) NSFDC Act
          </div>
          <div className="inline-flex items-center gap-1 bg-industrial-recessed p-1 rounded-lg border border-industrial-border shadow-recessed">
            <button
              className="w-7 h-7 flex items-center justify-center rounded text-industrial-ink-muted disabled:opacity-30 cursor-pointer"
              disabled
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-0.5 font-bold text-industrial-ink bg-industrial-panel rounded border border-industrial-border shadow-xs text-xs">
              1
            </span>
            <button
              className="w-7 h-7 flex items-center justify-center rounded text-industrial-ink-muted hover:text-industrial-ink cursor-pointer"
              type="button"
            >
              2
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center rounded text-industrial-ink-muted hover:text-industrial-ink cursor-pointer"
              type="button"
            >
              3
            </button>
            <span className="px-1 text-industrial-ink-muted">...</span>
            <button
              className="w-7 h-7 flex items-center justify-center rounded text-industrial-ink-muted hover:text-industrial-ink cursor-pointer"
              type="button"
            >
              21
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center rounded text-industrial-ink-muted hover:text-industrial-ink cursor-pointer"
              type="button"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </IndustrialCard>

      {/* Governance Policy Guidelines Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IndustrialCard variant="panel" className="p-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-industrial-ink uppercase tracking-wider">
            <Activity className="w-4 h-4 text-industrial-accent" />
            Automatic Traffic Throttle
          </div>
          <p className="font-sans text-xs text-industrial-ink-light leading-relaxed">
            Partners whose reported Gross NPA exceeds 5.0% for two consecutive
            reporting quarters have automated applicant dispatch withheld until
            restructuring verification.
          </p>
        </IndustrialCard>

        <IndustrialCard variant="panel" className="p-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-industrial-ink uppercase tracking-wider">
            <Scale className="w-4 h-4 text-industrial-accent" />
            PFMS Fund Refill Triggers
          </div>
          <p className="font-sans text-xs text-industrial-ink-light leading-relaxed">
            Tranche releases operate on a minimum 75% certified utilization
            threshold. State agencies can submit unutilized balance
            reconciliation requests online.
          </p>
        </IndustrialCard>

        <IndustrialCard variant="panel" className="p-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-industrial-ink uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-industrial-accent" />
            Statutory Compliance
          </div>
          <p className="font-sans text-xs text-industrial-ink-light leading-relaxed">
            All allocated loans are subject to CAG performance auditing and
            direct verification with Aadhaar-linked Jan Dhan Bank accounts.
          </p>
        </IndustrialCard>
      </div>

      {/* Heavy-Gauge Modal: Add New Channel Partner */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-industrial-panel rounded-xl max-w-2xl w-full p-6 shadow-card border border-industrial-border space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-industrial-border">
              <div>
                <h2 className="font-mono text-base font-bold text-industrial-ink uppercase">
                  {ui("Onboard Channel Partner", "चैनल साझेदार जोड़ें")} // नया
                  चैनल पार्टनर
                </h2>
                <p className="font-sans text-xs text-industrial-ink-light">
                  Issue institutional accreditation under MoSJE Concessional
                  Credit Schemes
                </p>
              </div>
              <button
                className="w-8 h-8 rounded-lg bg-industrial-panel border border-industrial-border shadow-xs hover:bg-industrial-recessed flex items-center justify-center text-industrial-ink-light hover:text-industrial-ink cursor-pointer transition-all duration-150"
                onClick={() => setIsAddModalOpen(false)}
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const partner = await addPartner({
                  name: newPartner.name,
                  type: newPartner.type,
                  partner_type: newPartner.type,
                  state: newPartner.state,
                  location: newPartner.state,
                  budget_cap: Number(newPartner.budgetCap) || 0,
                  budget_allocated: 0,
                  accepted_scheme_types: newPartner.schemes,
                  schemes: newPartner.schemes,
                  is_eligible: false,
                });
                setIsAddModalOpen(false);
                setNewPartner({
                  name: "",
                  type: "SCA",
                  state: "Uttar Pradesh",
                  budgetCap: "25",
                  schemes: ["term_loan", "micro_finance"],
                });
                showToast(
                  `${partner.name} saved to the partner directory and awaiting verification.`,
                );
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted font-bold block">
                    Institution Name
                  </label>
                  <input
                    className="w-full h-10 px-3 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed font-mono text-xs text-industrial-ink focus:outline-none focus:border-industrial-accent"
                    placeholder="e.g., Punjab Gramin Bank"
                    required
                    type="text"
                    value={newPartner.name}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted font-bold block">
                    Partner Type
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed font-mono text-xs text-industrial-ink focus:outline-none focus:border-industrial-accent"
                    required
                    value={newPartner.type}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                  >
                    <option value="SCA">State Channelising Agency (SCA)</option>
                    <option value="PSB">Public Sector Bank (PSB)</option>
                    <option value="RRB">Regional Rural Bank (RRB)</option>
                    <option value="NBFC-MFI">NBFC - MFI</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted font-bold block">
                    Operating State / UT
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed font-mono text-xs text-industrial-ink focus:outline-none focus:border-industrial-accent"
                    required
                    value={newPartner.state}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                  >
                    <option value="UP">Uttar Pradesh</option>
                    <option value="MH">Maharashtra</option>
                    <option value="TN">Tamil Nadu</option>
                    <option value="BR">Bihar</option>
                    <option value="RJ">Rajasthan</option>
                    <option value="ALL">Pan India (National Bank)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted font-bold block">
                    Sanctioned Credit Allocation (₹ Crores)
                  </label>
                  <div className="flex items-center">
                    <span className="h-10 px-3 rounded-l-lg bg-industrial-chassis border-y border-l border-industrial-border font-mono text-xs font-bold text-industrial-ink flex items-center">
                      ₹
                    </span>
                    <input
                      className="w-full h-10 px-3 rounded-r-lg bg-industrial-recessed border border-industrial-border shadow-recessed font-mono text-xs text-industrial-ink focus:outline-none focus:border-industrial-accent"
                      placeholder="25.00"
                      required
                      step="0.5"
                      type="number"
                      value={newPartner.budgetCap}
                      onChange={(e) =>
                        setNewPartner((prev) => ({
                          ...prev,
                          budgetCap: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted font-bold block">
                  Authorized Loan Products
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <label className="flex items-center gap-2 p-2.5 bg-industrial-recessed rounded-lg border border-industrial-border cursor-pointer hover:bg-industrial-panel transition-colors">
                    <input
                      defaultChecked
                      className="rounded text-industrial-accent"
                      type="checkbox"
                    />
                    <span>Term Loan</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-industrial-recessed rounded-lg border border-industrial-border cursor-pointer hover:bg-industrial-panel transition-colors">
                    <input
                      defaultChecked
                      className="rounded text-industrial-accent"
                      type="checkbox"
                    />
                    <span>Micro Finance</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-industrial-recessed rounded-lg border border-industrial-border cursor-pointer hover:bg-industrial-panel transition-colors">
                    <input
                      defaultChecked
                      className="rounded text-industrial-accent"
                      type="checkbox"
                    />
                    <span>Mahila Samriddhi</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-industrial-recessed rounded-lg border border-industrial-border cursor-pointer hover:bg-industrial-panel transition-colors">
                    <input
                      className="rounded text-industrial-accent"
                      type="checkbox"
                    />
                    <span>Green Business</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-industrial-recessed rounded-lg border border-industrial-border cursor-pointer hover:bg-industrial-panel transition-colors">
                    <input
                      className="rounded text-industrial-accent"
                      type="checkbox"
                    />
                    <span>Education Loan</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-industrial-recessed rounded-lg border border-industrial-border cursor-pointer hover:bg-industrial-panel transition-colors">
                    <input
                      className="rounded text-industrial-accent"
                      type="checkbox"
                    />
                    <span>Swachhta Udyami</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-industrial-border">
                <TactileButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </TactileButton>
                <TactileButton
                  variant="primary"
                  size="sm"
                  icon={<Check className="w-4 h-4" />}
                  type="submit"
                >
                  {ui("Issue Accreditation", "मान्यता जारी करें")}
                </TactileButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Industrial Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-industrial-panel border border-industrial-border shadow-card flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="font-mono text-xs text-industrial-ink font-semibold">
            {toastMessage}
          </span>
        </div>
      )}
    </div>
  );
}
