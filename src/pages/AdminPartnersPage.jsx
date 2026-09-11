import { useState, useMemo } from 'react'
import { usePartners } from '../hooks/usePartners'
import { supabase } from '../lib/supabase'

export default function AdminPartnersPage() {
  const { partners: fetchedPartners, loading } = usePartners()
  const [overrideMap, setOverrideMap] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'SCA' | 'PSB' | 'RRB'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Derive partners from fetched database rows merged with any local optimistic overrides
  const partners = useMemo(() => {
    return (fetchedPartners || []).map((p) => {
      const dbEligible = p.is_eligible !== undefined ? Boolean(p.is_eligible) : Boolean(p.isEligible)
      const isEligible = overrideMap[p.id] !== undefined ? overrideMap[p.id] : dbEligible

      const name = p.name || 'Channel Partner'
      const shortName = p.short_name || p.shortName || name
      const badge = p.badge || (shortName || name || 'CP').slice(0, 3).toUpperCase()
      const type = (p.partner_type || p.type || 'SCA').toUpperCase()
      const typeBadge = p.type_badge || p.typeBadge || type
      const code = p.partner_code || p.code || `CP-${String(p.id).slice(0, 4).toUpperCase()}`
      const state = p.state || 'Uttar Pradesh'
      const location = p.location || p.address || 'District Office'

      let schemes = ['Term Loan', 'Micro Finance', 'Mahila Samriddhi']
      if (Array.isArray(p.schemes) && p.schemes.length > 0) {
        schemes = p.schemes
      } else if (Array.isArray(p.accepted_scheme_types) && p.accepted_scheme_types.length > 0) {
        schemes = p.accepted_scheme_types.map((t) =>
          typeof t === 'string'
            ? t
                .split('_')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : String(t)
        )
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
        budgetAllocated: Number(p.budget_allocated ?? p.budgetAllocated ?? 40.0),
        utilizationPct: Number(p.utilization_pct ?? p.utilizationPct ?? 80.0),
        npaRatio: Number(p.npa_ratio ?? p.npaRatio ?? 3.5),
        isEligible,
        is_eligible: isEligible,
      }
    })
  }, [fetchedPartners, overrideMap])

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  // Handle toggling eligibility with optimistic local update and revert on error
  const handleToggleEligibility = async (partner) => {
    const previousValue = Boolean(partner.isEligible ?? partner.is_eligible)
    const newValue = !previousValue
    const partnerId = partner.id
    const partnerName = partner.shortName || partner.name || 'Partner'

    // 1. Optimistically update local state first
    setOverrideMap((prev) => ({
      ...prev,
      [partnerId]: newValue,
    }))

    showToast(
      newValue
        ? `Applicant routing enabled for ${partnerName}`
        : `Traffic routing paused for ${partnerName}`
    )

    // 2. Perform backend update via supabase
    try {
      const { error } = await supabase
        .from('channel_partners')
        .update({ is_eligible: newValue })
        .eq('id', partner.id)

      if (error) {
        throw error
      }
    } catch (err) {
      console.error('Failed to update partner eligibility in Supabase:', err)
      // 3. Revert on error
      setOverrideMap((prev) => ({
        ...prev,
        [partnerId]: previousValue,
      }))
      showToast(`Error updating status for ${partnerName}. Changes reverted.`)
    }
  }

  // Filtered partners based on search and type chip
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = p.name.toLowerCase().includes(q)
        const matchShort = p.shortName.toLowerCase().includes(q)
        const matchState = p.state.toLowerCase().includes(q)
        const matchCode = p.code.toLowerCase().includes(q)
        const matchType = p.type.toLowerCase().includes(q)
        if (!matchName && !matchShort && !matchState && !matchCode && !matchType) {
          return false
        }
      }
      return true
    })
  }, [partners, filterType, searchQuery])

  // Aggregate active counts
  const activeCount = partners.filter((p) => p.isEligible).length

  return (
    <div className="w-full px-gutter-lg py-space-lg flex flex-col gap-space-lg">
      {/* Breadcrumb & Desk Context Banner */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low px-gutter-md py-space-sm rounded-xl border border-outline-variant/30">
        <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
          <span className="material-symbols-outlined text-base">shield_person</span>
          <span>Governance Portal</span>
          <span>/</span>
          <span className="text-primary font-bold">Desk Audit &amp; Partner Management</span>
          <span className="bg-surface-container-highest text-primary font-label-sm text-label-sm px-2 py-0.5 rounded">
            Q3 Review Cycle
          </span>
        </div>
        <div className="flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span> System Synchronized: Today, 11:42 IST
          </span>
          <span className="text-outline">|</span>
          <span>
            Authorized Officer: <strong>S. Venkatachalam (Director, Credit)</strong>
          </span>
        </div>
      </div>

      {/* Screen Title Header with Official Badging */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md pb-space-xs">
        <div className="max-w-3xl space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm tracking-wide uppercase font-bold">
            <span className="material-symbols-outlined text-sm">corporate_fare</span>
            MoSJE Financial Intermediary Oversight
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Channel Partner Governance &amp; Allocation | चैनल पार्टनर प्रबंधन
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Monitor State Channelising Agencies (SCAs), Public Sector Banks (PSBs), and RRBs under MoSJE Credit Directives.
          </p>
        </div>
        <div className="flex items-center gap-space-sm self-start lg:self-end flex-wrap">
          <button
            className="h-12 px-space-md rounded bg-surface-container-highest hover:bg-surface-dim text-primary font-label-lg text-label-lg flex items-center gap-2 transition-all duration-200 shadow-xs cursor-pointer"
            onClick={() => showToast('Generating MoSJE Partner Compliance Ledger (CSV & Signed PDF)...')}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>Export Regulatory Report</span>
          </button>
          <button
            className="h-12 px-space-md rounded bg-secondary text-on-secondary hover:bg-on-secondary-container font-label-lg text-label-lg flex items-center gap-2 transition-all duration-200 shadow-xs cursor-pointer"
            onClick={() => setIsAddModalOpen(true)}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">add_business</span>
            <span>Add Channel Partner</span>
          </button>
        </div>
      </div>

      {/* Administrative KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Total Active Partners
              </span>
              <div className="font-display-lg text-display-lg text-primary mt-1 leading-none font-bold">
                {activeCount} <span className="text-headline-sm font-normal text-on-surface-variant">/ {partners.length}</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                84 Accredited Nationally
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center gap-2 font-label-sm text-label-sm text-tertiary">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>100% Onboarded via PFMS</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Total Funds Allocated
              </span>
              <div className="font-display-lg text-display-lg text-primary mt-1 leading-none font-bold">
                ₹420.50<span className="font-title-sm text-title-sm font-normal text-on-surface-variant ml-1">Cr</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                FY 2024–25 Sanctioned Cap
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
            <span className="font-bold text-primary">₹367.51 Cr</span> disbursed to accounts
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Avg Fund Utilization
              </span>
              <div className="font-display-lg text-display-lg text-primary mt-1 leading-none font-bold">
                87.4%
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                Benchmark target: ≥80%
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center gap-2">
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '87.4%' }}></div>
            </div>
            <span className="font-label-sm text-label-sm font-bold text-tertiary">+4.2%</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Portfolio Health (NPA)
              </span>
              <div className="font-display-lg text-display-lg text-primary mt-1 leading-none font-bold">
                3.8%
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                Gross Non-Performing Ratio
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined">health_and_safety</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span>Prudential Ceiling Limit: 5.0%</span>
          </div>
        </div>
      </div>

      {/* Institutional Safeguard Context Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-outline-variant/30 items-center">
        <div className="lg:col-span-8 flex flex-col md:flex-row gap-space-md items-start md:items-center">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <div className="space-y-1">
            <div className="font-title-sm text-title-sm text-primary font-bold">
              Direct Beneficiary Transfer (DBT) Safeguard Protocol Active
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Partners breaching the 5.0% Gross NPA threshold trigger automated routing restrictions on concessional micro-credit products. Desk audits require direct sign-off before fiscal limits can be reassigned.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-label-sm text-label-sm">
              <span className="bg-surface-container text-primary px-2 py-0.5 rounded font-bold">NSFDC Mandate</span>
              <span className="bg-surface-container text-primary px-2 py-0.5 rounded font-bold">NBCFDC Directives</span>
              <span className="bg-surface-container text-primary px-2 py-0.5 rounded font-bold">RBI Priority Sector Norms</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center bg-surface-container-low p-space-sm rounded-lg border border-outline-variant/20">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Dynamic Routing Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-3 h-3 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-title-md text-title-md text-primary font-bold">
              Algorithmic Load Balancing Live
            </span>
          </div>
          <span className="font-body-sm text-body-sm text-on-surface-variant text-right">
            Routing applicants across {activeCount} eligible channel desks
          </span>
        </div>
      </div>

      {/* Table Management Bar: Filters, Search, Batch Control */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs border border-outline-variant/30 space-y-space-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              className="w-full h-12 pl-10 pr-4 bg-surface-container-low rounded text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none shadow-xs placeholder:text-on-surface-variant border border-outline-variant/30"
              placeholder="Search by partner name, nodal state, or type..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Chips & Actions */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="inline-flex rounded bg-surface-container p-1 text-label-sm font-label-sm">
              <button
                className={`px-3 py-1.5 rounded transition-all duration-200 cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setFilterType('all')}
                type="button"
              >
                All Types ({partners.length})
              </button>
              <button
                className={`px-3 py-1.5 rounded transition-all duration-200 cursor-pointer ${
                  filterType === 'SCA'
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setFilterType('SCA')}
                type="button"
              >
                SCAs ({partners.filter((p) => p.type === 'SCA').length})
              </button>
              <button
                className={`px-3 py-1.5 rounded transition-all duration-200 cursor-pointer ${
                  filterType === 'PSB'
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setFilterType('PSB')}
                type="button"
              >
                PSBs ({partners.filter((p) => p.type === 'PSB').length})
              </button>
              <button
                className={`px-3 py-1.5 rounded transition-all duration-200 cursor-pointer ${
                  filterType === 'RRB'
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => setFilterType('RRB')}
                type="button"
              >
                RRBs ({partners.filter((p) => p.type === 'RRB').length})
              </button>
            </div>
            <button
              className="h-12 px-space-md rounded bg-surface-container-highest hover:bg-surface-dim text-primary font-label-lg text-label-lg flex items-center gap-2 transition-all duration-200 cursor-pointer"
              onClick={() => showToast('Batch audit verification requested for all active channel partners.')}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">rule_settings</span>
              <span>Batch Update Thresholds</span>
            </button>
          </div>
        </div>

        {/* Partner Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l">Partner Name &amp; State</th>
                <th className="py-3 px-4">Partner Type</th>
                <th className="py-3 px-4">Allocated Budget &amp; Util. %</th>
                <th className="py-3 px-4">Gross NPA Ratio (Desk Audit)</th>
                <th className="py-3 px-4">Schemes Handled</th>
                <th className="py-3 px-4">Eligibility Status</th>
                <th className="py-3 px-4 text-center rounded-r">Applicant Routing</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant/20">
              {loading && partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant font-label-md">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary text-xl">progress_activity</span>
                      <span>Loading channel partner governance directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant font-label-md">
                    <span className="material-symbols-outlined text-3xl mb-1 text-outline block">corporate_fare</span>
                    <span>No channel partners found matching the selected criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => {
                const isBreached = partner.npaRatio > 5.0

                return (
                  <tr
                    key={partner.id}
                    className="hover:bg-surface-container-low transition-all duration-200"
                  >
                    {/* Column 1: Partner Name & State */}
                    <td className="py-4 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center font-title-sm text-title-sm text-primary flex-shrink-0 font-bold">
                          {partner.badge}
                        </div>
                        <div className="min-w-0">
                          <div className="font-title-sm text-title-sm text-primary font-semibold truncate">
                            {partner.name}
                          </div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            <span>{partner.location} • {partner.code}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Partner Type */}
                    <td className="py-4 px-4 align-middle">
                      <span className="inline-flex items-center px-2.5 py-1 rounded font-label-sm text-label-sm bg-surface-container-highest text-primary font-bold">
                        {partner.type}
                      </span>
                    </td>

                    {/* Column 3: Allocated Budget & Util. % (READ-ONLY) */}
                    <td className="py-4 px-4 align-middle">
                      <div className="w-48 space-y-1">
                        <div className="flex justify-between font-label-sm text-label-sm">
                          <span className="font-bold text-primary">₹{partner.budgetAllocated.toFixed(2)} Cr</span>
                          <span
                            className={`font-bold ${
                              partner.utilizationPct >= 80 ? 'text-tertiary' : 'text-secondary'
                            }`}
                          >
                            {partner.utilizationPct}% Utilized
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              partner.utilizationPct >= 80 ? 'bg-tertiary' : 'bg-secondary-container'
                            }`}
                            style={{ width: `${partner.utilizationPct}%` }}
                          ></div>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant block text-xs">
                          Cap: ₹{partner.budgetCap.toFixed(2)} Cr (Read-Only)
                        </span>
                      </div>
                    </td>

                    {/* Column 4: Gross NPA Ratio (Desk Audit) (READ-ONLY) */}
                    <td className="py-4 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div
                          className={`relative w-24 h-9 px-2 flex items-center justify-end rounded font-title-sm text-title-sm font-bold border border-outline-variant/30 ${
                            isBreached
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-surface-container-low text-on-surface'
                          }`}
                          title="Read-only statutory desk audit metric"
                        >
                          <span>{partner.npaRatio.toFixed(1)}%</span>
                        </div>
                        <span
                          className={`material-symbols-outlined text-base ${
                            isBreached ? 'text-error' : 'text-tertiary'
                          }`}
                          title={isBreached ? 'NPA Breached 5% Cap Limit' : 'Within Permissible Bounds'}
                        >
                          {isBreached ? 'warning' : 'verified'}
                        </span>
                      </div>
                    </td>

                    {/* Column 5: Schemes Handled */}
                    <td className="py-4 px-4 align-middle">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {partner.schemes.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container text-on-surface-variant whitespace-nowrap"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Column 6: Eligibility Status */}
                    <td className="py-4 px-4 align-middle">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-label-sm text-label-sm font-bold ${
                          partner.isEligible
                            ? 'bg-surface-container text-tertiary'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            partner.isEligible ? 'bg-tertiary' : 'bg-error'
                          }`}
                        ></span>
                        {partner.isEligible ? 'Active / सक्रिय' : 'Capacity Capped / सीमित'}
                      </span>
                    </td>

                    {/* Column 7: Applicant Routing (Wired to Supabase with optimistic update) */}
                    <td className="py-4 px-4 align-middle text-center">
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          checked={Boolean(partner.isEligible ?? partner.is_eligible)}
                          className="sr-only peer"
                          type="checkbox"
                          onChange={() => handleToggleEligibility(partner)}
                        />
                        <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 transition-all duration-200 peer-checked:bg-primary shadow-xs"></div>
                      </label>
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>

        {/* Pagination & Desk Footnote */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-xs text-on-surface-variant font-label-sm text-label-sm">
          <div>
            Showing <strong>{filteredPartners.length}</strong> of <strong>{partners.length}</strong> channel partner institutions | Statutory audit mandated under section 14(1) NSFDC Act
          </div>
          <div className="inline-flex items-center gap-1 bg-surface-container-low p-1 rounded border border-outline-variant/30">
            <button
              className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant disabled:opacity-40 transition-all duration-200"
              disabled
              type="button"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <span className="px-3 py-1 font-bold text-primary bg-surface-container-lowest rounded shadow-xs">
              1
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-on-surface-variant cursor-pointer transition-all duration-200"
              type="button"
            >
              2
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-on-surface-variant cursor-pointer transition-all duration-200"
              type="button"
            >
              3
            </button>
            <span className="px-1 text-outline">...</span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-on-surface-variant cursor-pointer transition-all duration-200"
              type="button"
            >
              21
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-on-surface-variant cursor-pointer transition-all duration-200"
              type="button"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Governance Policy Guidelines Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 space-y-2">
          <div className="flex items-center gap-2 text-primary font-title-sm text-title-sm font-bold">
            <span className="material-symbols-outlined text-secondary">verified_user</span>
            Automatic Traffic Throttle
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Partners whose reported Gross NPA exceeds 5.0% for two consecutive reporting quarters have automated applicant dispatch withheld until restructuring verification.
          </p>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 space-y-2">
          <div className="flex items-center gap-2 text-primary font-title-sm text-title-sm font-bold">
            <span className="material-symbols-outlined text-secondary">balance</span>
            PFMS Fund Refill Triggers
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Tranche releases operate on a minimum 75% certified utilization threshold. State agencies can submit unutilized balance reconciliation requests online.
          </p>
        </div>
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30 space-y-2">
          <div className="flex items-center gap-2 text-primary font-title-sm text-title-sm font-bold">
            <span className="material-symbols-outlined text-secondary">gavel</span>
            Statutory Compliance
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            All allocated loans are subject to CAG performance auditing and direct verification with Aadhaar-linked Jan Dhan Bank accounts.
          </p>
        </div>
      </div>

      {/* Modal: Add New Channel Partner */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-xs p-space-md">
          <div className="bg-surface-container-lowest rounded-xl max-w-2xl w-full p-space-lg shadow-xl space-y-space-md animate-in fade-in border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-xs">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Onboard Channel Partner (नया चैनल पार्टनर)
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Issue institutional accreditation under MoSJE Concessional Credit Schemes
                </p>
              </div>
              <button
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer transition-all duration-200"
                onClick={() => setIsAddModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form
              className="space-y-space-md"
              onSubmit={(e) => {
                e.preventDefault()
                setIsAddModalOpen(false)
                showToast('New Channel Partner successfully accredited in live governance ledger.')
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Institution Name
                  </label>
                  <input
                    className="w-full h-11 px-3 rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none border border-outline-variant/30"
                    placeholder="e.g., Punjab Gramin Bank"
                    required
                    type="text"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Partner Type
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none border border-outline-variant/30"
                    required
                  >
                    <option value="SCA">State Channelising Agency (SCA)</option>
                    <option value="PSB">Public Sector Bank (PSB)</option>
                    <option value="RRB">Regional Rural Bank (RRB)</option>
                    <option value="NBFC-MFI">NBFC - MFI</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Operating State / Union Territory
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none border border-outline-variant/30"
                    required
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
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Sanctioned Credit Allocation (₹ Crores)
                  </label>
                  <div className="flex items-center">
                    <span className="h-11 px-3 rounded-l bg-surface-container-high text-primary font-bold flex items-center border-y border-l border-outline-variant/30">
                      ₹
                    </span>
                    <input
                      className="w-full h-11 px-3 rounded-r bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none border border-outline-variant/30"
                      placeholder="25.00"
                      required
                      step="0.5"
                      type="number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  Authorized Loan Products
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-label-sm text-label-sm">
                  <label className="flex items-center gap-2 p-2 bg-surface-container-low rounded cursor-pointer border border-outline-variant/20 hover:bg-surface-container transition-all duration-200">
                    <input defaultChecked className="rounded text-primary" type="checkbox" />
                    <span>Term Loan Scheme</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface-container-low rounded cursor-pointer border border-outline-variant/20 hover:bg-surface-container transition-all duration-200">
                    <input defaultChecked className="rounded text-primary" type="checkbox" />
                    <span>Micro Finance Scheme</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface-container-low rounded cursor-pointer border border-outline-variant/20 hover:bg-surface-container transition-all duration-200">
                    <input defaultChecked className="rounded text-primary" type="checkbox" />
                    <span>Mahila Samriddhi</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface-container-low rounded cursor-pointer border border-outline-variant/20 hover:bg-surface-container transition-all duration-200">
                    <input className="rounded text-primary" type="checkbox" />
                    <span>Green Business</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface-container-low rounded cursor-pointer border border-outline-variant/20 hover:bg-surface-container transition-all duration-200">
                    <input className="rounded text-primary" type="checkbox" />
                    <span>Education Loan</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-surface-container-low rounded cursor-pointer border border-outline-variant/20 hover:bg-surface-container transition-all duration-200">
                    <input className="rounded text-primary" type="checkbox" />
                    <span>Swachhta Udyami</span>
                  </label>
                </div>
              </div>

              <div className="pt-space-sm flex justify-end gap-space-sm border-t border-outline-variant/20">
                <button
                  className="h-11 px-space-md rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-label-lg text-label-lg transition-all duration-200 cursor-pointer"
                  onClick={() => setIsAddModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="h-11 px-space-md rounded bg-secondary text-on-secondary hover:bg-on-secondary-container font-label-lg text-label-lg flex items-center gap-1.5 transition-all duration-200 shadow-xs cursor-pointer"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Issue Accreditation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-space-md rounded-xl bg-primary text-on-primary shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-tertiary-fixed text-2xl">check_circle</span>
          <span className="font-label-lg text-label-lg">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
