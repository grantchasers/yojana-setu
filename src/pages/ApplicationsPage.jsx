import { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { formatCurrency } from '../lib/formatCurrency'
import { useAuth } from '../context/AuthContext'
import { useApplications } from '../hooks/useApplications'

// Helper to normalize applications from database into UI presentation model
function normalizeApplication(app) {
  const rawStatus = (app.status || 'submitted').toLowerCase()
  const isCompleted = ['approved', 'sanctioned', 'disbursed', 'completed'].includes(rawStatus)
  const isDisbursed = rawStatus === 'disbursed'
  const isApproved = rawStatus === 'approved' || rawStatus === 'sanctioned'
  const isRouted = rawStatus === 'routed'

  const idFormatted = app.id
    ? String(app.id).startsWith('YS-')
      ? app.id
      : `YS-${String(app.id).slice(0, 8).toUpperCase()}`
    : 'YS-2025-APP'

  const title =
    app.scheme_name ||
    app.schemes?.name ||
    app.schemes?.title ||
    'NSFDC Term Loan Scheme - Micro Enterprise'

  const titleHi =
    app.schemes?.title_hi ||
    app.schemes?.titleHi ||
    'राष्ट्रीय अनुसूचित जाति वित्त एवं विकास निगम सावधि ऋण योजना'

  const schemeBadge =
    app.schemes?.agency ||
    app.schemes?.code ||
    'MoSJE Central Scheme'

  const category = isCompleted ? 'completed' : 'in-progress'

  const statusText = isDisbursed
    ? 'Disbursed'
    : isApproved
    ? 'Approved'
    : isRouted
    ? 'Routed'
    : 'Submitted'

  const statusBadgeText = isDisbursed
    ? 'Approved & Disbursed (स्वीकृत एवं वितरित)'
    : isApproved
    ? 'Approved / Sanctioned (स्वीकृत)'
    : isRouted
    ? 'Under Review / Routed to Partner'
    : 'Submitted / Portal Registration'

  const statusBadgeHi = isDisbursed
    ? 'पूर्ण एवं वितरित'
    : isApproved
    ? 'स्वीकृत'
    : isRouted
    ? 'समीक्षा जारी है / अग्रेषित'
    : 'प्रस्तुत / प्रारंभिक सत्यापन'

  const amountVal = app.requested_amount || app.project_cost || 135000
  const formattedAmount = formatCurrency(amountVal)

  const submissionDate = app.created_at
    ? new Date(app.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '12 February 2025'

  const submissionDateShort = app.created_at
    ? new Date(app.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })
    : 'Recent'

  const partnerName =
    app.partner_name ||
    app.channel_partners?.name ||
    'UP Scheduled Castes Finance & Dev Corp (UPSCFDC)'

  const partnerOffice =
    app.channel_partners?.location ||
    app.channel_partners?.address ||
    'Lucknow District Office • Vikas Bhawan'

  const fileNo = app.file_no || `LKO/YS/2025/${String(app.id || '084').slice(0, 4).toUpperCase()}`
  const nodalOfficer = app.nodal_officer || 'Mr. Anil Verma'
  const officerRole = app.officer_role || 'District Welfare Inspector'
  const officerInitials = app.officer_initials || 'AV'
  const officerLine = app.officer_line || '0522-2618991'

  const officerNote =
    app.officer_note ||
    (isDisbursed
      ? 'Direct Benefit Transfer processed via PFMS Gateway to registered beneficiary account.'
      : isApproved
      ? 'Credit committee appraisal completed successfully. Sanction order issued.'
      : isRouted
      ? 'Physical field verification completed at workshop premises. Asset quotation and caste credentials verified intact. Recommendation forwarded favorably to State Credit Committee.'
      : 'Application successfully accepted into the central system with DigiLocker verified identity. File queued for dispatch to designated nodal desk for pre-sanction screening.')

  const officerNoteDate = app.created_at
    ? new Date(app.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent'

  const currentStepIndex = isDisbursed ? 5 : isApproved ? 4 : isRouted ? 3 : 1
  const progressLineWidth = isDisbursed
    ? '100%'
    : isApproved
    ? '75%'
    : isRouted
    ? '45%'
    : '10%'

  const milestones = [
    {
      step: 1,
      title: '1. Submitted',
      date: submissionDateShort,
      sub: 'Portal Registration',
      status: 'completed',
      desc: 'Validated via DigiLocker eKYC & MoSJE Portal.',
    },
    {
      step: 2,
      title: '2. Routed to Partner',
      date: isRouted || isApproved || isDisbursed ? 'Completed' : 'Queued for Dispatch',
      sub: partnerName,
      status: isRouted || isApproved || isDisbursed ? 'completed' : 'pending',
      desc: isRouted || isApproved || isDisbursed ? 'Transferred to district channel desk.' : 'Awaiting nodal routing confirmation.',
    },
    {
      step: 3,
      title: '3. Verification Check',
      date: isRouted ? 'Active • In Progress' : isApproved || isDisbursed ? 'Completed' : 'Upcoming',
      sub: 'Field & Document Review',
      status: isRouted ? 'active' : isApproved || isDisbursed ? 'completed' : 'pending',
      desc: 'Physical field visit & quotation appraisal.',
    },
    {
      step: 4,
      title: '4. Credit Sanction',
      date: isApproved ? 'Active • Sanctioned' : isDisbursed ? 'Completed' : 'Target Stage',
      sub: 'Credit Committee Review',
      status: isApproved ? 'active' : isDisbursed ? 'completed' : 'pending',
      desc: 'State Credit Committee evaluation.',
    },
    {
      step: 5,
      title: '5. DBT Disbursement',
      date: isDisbursed ? 'Completed' : 'Final Stage',
      sub: 'Direct to Bank A/c',
      status: isDisbursed ? 'completed' : 'pending',
      desc: 'Direct DBT credit to bank account.',
    },
  ]

  return {
    ...app,
    id: idFormatted,
    rawId: app.id,
    title,
    titleHi,
    schemeBadge,
    category,
    status: statusText,
    statusBadgeText,
    statusBadgeHi,
    sanctionSought: formattedAmount,
    disbursedAmount: formattedAmount,
    submissionDate,
    submissionMode: 'Digital portal submission via MoSJE-SSO',
    ekycVerified: true,
    partnerName,
    partnerOffice,
    fileNo,
    nodalOfficer,
    officerRole,
    officerInitials,
    officerLine,
    officerNote,
    officerNoteDate,
    expectedDecisionDate: isCompleted ? null : 'Within 7 working days',
    daysRemaining: isCompleted ? null : 'Standard SLA',
    currentStepIndex,
    progressLineWidth,
    milestones,
    bankAccount: 'Bank of Baroda ••••3918',
    utrNumber: `PFMS${String(app.id || '2025').slice(0, 8).toUpperCase()}`,
    credential: 'MoSJE DBT Certified Beneficiary',
  }
}

export default function ApplicationsPage() {
  const { user, profile } = useAuth()
  const { applications: rawApplications, loading } = useApplications(user?.id)

  const [filter, setFilter] = useState('all') // 'all' | 'in-progress' | 'completed'
  const [selectedAppModal, setSelectedAppModal] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (title, msg) => {
    setToastMessage({ title, msg })
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  const applications = useMemo(() => {
    return (rawApplications || []).map(normalizeApplication)
  }, [rawApplications])

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (filter === 'all') return true
      if (filter === 'in-progress') return app.category === 'in-progress'
      if (filter === 'completed') return app.category === 'completed'
      return true
    })
  }, [applications, filter])

  return (
    <div className="w-full px-gutter-lg py-space-lg flex flex-col gap-space-lg">
      {/* Notice Banner: Citizen Assurance */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-high p-space-md shadow-xs border border-outline-variant/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-title-md text-title-md text-primary font-bold">
                  Direct Transparency Track • प्रत्यक्ष पारदर्शिता प्रणाली
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-secondary font-label-sm text-label-sm shadow-xs font-semibold">
                  MoSJE SLA Guard
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Applications are time-bound by the Public Services Guarantee Act. Nodal officers are directly accountable for verification timelines.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm self-stretch md:self-auto justify-end">
            <div className="px-space-sm py-1.5 rounded-lg bg-surface-container-lowest text-on-surface text-center shadow-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase block">Average Processing</span>
              <span className="font-title-sm text-title-sm text-primary font-bold">11 Working Days</span>
            </div>
            <div className="px-space-sm py-1.5 rounded-lg bg-surface-container-lowest text-on-surface text-center shadow-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase block">Direct DBT Guarantee</span>
              <span className="font-title-sm text-title-sm text-tertiary-container font-bold">Zero Intermediary</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
              Applicant Dashboard / नागरिक ट्रैकर
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
            <span className="font-label-sm text-label-sm text-outline">Aadhaar Linked: XXXXXXXX4910</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight mt-1">
            My Scheme Applications <span className="font-headline-md text-headline-md text-on-surface-variant font-normal">/ मेरे प्रस्तुत आवेदन</span>
          </h1>
        </div>

        {/* Active Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-high self-stretch md:self-auto overflow-x-auto shadow-xs">
          <button
            className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              filter === 'all'
                ? 'bg-primary text-on-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
            onClick={() => setFilter('all')}
            type="button"
          >
            <span>All Applications</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'all' ? 'bg-on-primary/20 text-on-primary' : 'bg-primary/10 text-primary'
            }`}>
              {applications.length}
            </span>
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              filter === 'in-progress'
                ? 'bg-primary text-on-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
            onClick={() => setFilter('in-progress')}
            type="button"
          >
            <span>In Progress (प्रगति पर)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'in-progress' ? 'bg-on-primary/20 text-on-primary' : 'bg-secondary-container/20 text-secondary'
            }`}>
              {applications.filter((a) => a.category === 'in-progress').length}
            </span>
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              filter === 'completed'
                ? 'bg-primary text-on-primary shadow-xs font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
            onClick={() => setFilter('completed')}
            type="button"
          >
            <span>Sanctioned / Completed (स्वीकृत)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'completed' ? 'bg-on-primary/20 text-on-primary' : 'bg-tertiary/10 text-tertiary'
            }`}>
              {applications.filter((a) => a.category === 'completed').length}
            </span>
          </button>
        </div>
      </div>

      {/* Applications List, 3-Row Skeleton Loader, or Friendly Empty State */}
      {loading ? (
        <div className="flex flex-col gap-space-lg">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 overflow-hidden animate-pulse p-space-lg gap-space-md"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                <div className="flex items-start gap-space-md">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-high shrink-0" />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-4 bg-surface-container-high rounded" />
                      <div className="w-36 h-4 bg-surface-container-high rounded" />
                      <div className="w-28 h-4 bg-surface-container-high rounded" />
                    </div>
                    <div className="w-64 sm:w-96 h-6 bg-surface-container-high rounded" />
                    <div className="w-48 h-3 bg-surface-container-high rounded" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-start lg:items-end">
                  <div className="w-48 h-8 rounded-full bg-surface-container-high" />
                  <div className="w-32 h-4 bg-surface-container-high rounded" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-surface-container border-y border-outline-variant/20">
                <div className="bg-surface-container-lowest p-space-md h-24" />
                <div className="bg-surface-container-lowest p-space-md h-24" />
                <div className="bg-surface-container-lowest p-space-md h-24" />
              </div>

              <div className="h-16 bg-surface-container-low rounded-lg" />

              <div className="flex items-center justify-between pt-space-xs">
                <div className="w-36 h-10 bg-surface-container-high rounded-lg" />
                <div className="w-56 h-10 bg-surface-container-high rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mb-space-md shadow-xs">
            <span className="material-symbols-outlined text-4xl">folder_open</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary font-bold mb-2">
            No Scheme Applications Yet / अभी तक कोई आवेदन नहीं
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mb-space-lg">
            You haven't submitted any applications for concessional credit or welfare subsidies yet. Discover tailored central schemes and apply in under 2 minutes with our Scheme Recommender.
          </p>
          <NavLink
            to="/recommender"
            className="inline-flex items-center gap-2 px-space-xl py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all duration-200"
          >
            <span className="material-symbols-outlined text-xl">smart_toy</span>
            <span>Start Scheme Recommender (योजना सिफारिश शुरू करें)</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </NavLink>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm">
          <div className="w-16 h-16 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center mb-space-md">
            <span className="material-symbols-outlined text-3xl">filter_list_off</span>
          </div>
          <h3 className="font-title-lg text-title-lg text-primary font-bold mb-1">
            No Applications in "{filter}" Category
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
            There are no applications matching the selected status filter.
          </p>
          <button
            onClick={() => setFilter('all')}
            className="px-space-md py-2 rounded-lg bg-surface-container-highest text-primary font-label-md text-label-md cursor-pointer hover:bg-surface-dim transition-all duration-200"
            type="button"
          >
            View All Applications ({applications.length})
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-space-lg">
          {filteredApplications.map((app) => {
          const isCompleted = app.category === 'completed'

          return (
            <section
              key={app.id}
              className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 overflow-hidden"
            >
              {/* Card Top Identity Bar */}
              <div className="p-space-lg bg-gradient-to-r from-surface-container-low via-surface-container-lowest to-surface-container-low flex flex-col lg:flex-row lg:items-center justify-between gap-space-md border-b border-outline-variant/20">
                <div className="flex items-start gap-space-md min-w-0">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isCompleted ? 'bg-tertiary-container text-on-tertiary' : 'bg-primary-container text-on-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl">
                      {isCompleted ? 'school' : app.status === 'Submitted' ? 'hourglass_top' : 'store'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold tracking-wide">
                        #{app.id}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold">
                        {app.schemeBadge}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-tertiary text-tertiary-fixed'
                            : 'bg-tertiary-fixed text-on-tertiary-fixed'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isCompleted ? 'verified' : 'bolt'}
                        </span>
                        {isCompleted ? 'Sanctioned & Disbursed' : 'Fast Track Pipeline'}
                      </span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-primary mt-1.5 font-bold truncate">
                      {app.title}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {app.titleHi}
                    </p>
                  </div>
                </div>

                {/* Live Status Pill & Target */}
                <div className="flex flex-row lg:flex-col items-start lg:items-end justify-between gap-space-xs shrink-0 pt-2 lg:pt-0">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full shadow-xs ${
                      isCompleted
                        ? 'bg-tertiary-container text-tertiary-fixed'
                        : app.status === 'Submitted'
                        ? 'bg-surface-container-highest text-primary'
                        : 'bg-primary-container text-on-primary'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isCompleted
                          ? 'bg-tertiary-fixed'
                          : app.status === 'Submitted'
                          ? 'bg-primary animate-pulse'
                          : 'bg-secondary-fixed-dim animate-pulse'
                      }`}
                    />
                    <span className="font-label-md text-label-md font-bold tracking-wide">
                      {app.statusBadgeText}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-label-sm text-label-sm text-outline">
                      {isCompleted ? 'Disbursed DBT:' : 'Sanction Sought:'}
                    </span>
                    <span
                      className={`font-title-lg text-title-lg font-bold ${
                        isCompleted ? 'text-tertiary-container' : 'text-primary'
                      }`}
                    >
                      {isCompleted ? app.disbursedAmount : app.sanctionSought}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metadata & Officer Accountability Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-surface-container border-b border-outline-variant/20">
                {/* Submission Context */}
                <div className="bg-surface-container-lowest p-space-md flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span> Submission Audit
                  </span>
                  <div className="mt-2">
                    <div className="font-title-sm text-title-sm text-on-surface font-semibold">
                      {app.submissionDate || (isCompleted ? `Disbursed: ${app.disbursedDate}` : 'Recent')}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      {app.submissionMode || 'Certified e-Sign submission'}
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-tertiary font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Aadhaar eKYC Verified
                  </div>
                </div>

                {/* Channel Partner */}
                <div className="bg-surface-container-lowest p-space-md flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">corporate_fare</span> Designated Partner Agency
                  </span>
                  <div className="mt-2">
                    <div className="font-title-sm text-title-sm text-on-surface font-semibold">
                      {app.partnerName}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      {app.partnerOffice}
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-sm">tag</span> File No: {app.fileNo}
                  </div>
                </div>

                {/* Accountable Nodal Officer */}
                <div className="bg-surface-container-lowest p-space-md flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">badge</span> Assigned Nodal Officer
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                      {app.officerRole}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold font-title-sm">
                      {app.officerInitials}
                    </div>
                    <div className="flex flex-col">
                      <div className="font-title-sm text-title-sm text-on-surface font-semibold">{app.nodalOfficer}</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">{app.officerRole}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between font-label-sm text-label-sm pt-2 bg-surface-container-low/50 px-2 rounded">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">call</span> Official Line: {app.officerLine}
                    </span>
                    <span className="text-secondary font-semibold">MoSJE Audited</span>
                  </div>
                </div>
              </div>

              {/* Status Timeline Track */}
              <div className="p-space-lg bg-surface-container-lowest flex flex-col gap-space-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">timeline</span>
                    <span className="font-title-md text-title-md text-primary font-bold">
                      Application Lifecycle Milestone Track
                    </span>
                  </div>
                  {app.expectedDecisionDate && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Expected Committee Decision: <strong className="text-on-surface">{app.expectedDecisionDate}</strong> ({app.daysRemaining})
                      </span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Disbursed via PFMS: <strong className="text-on-surface">{app.disbursedDate}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Desktop Horizontal Stepper Track */}
                <div className="relative py-space-sm hidden md:block">
                  {/* Connecting Line Background */}
                  <div className="absolute top-8 left-10 right-10 h-1 bg-surface-container-high -translate-y-1/2 z-0"></div>
                  {/* Progress Active Line */}
                  <div
                    className="absolute top-8 left-10 h-1 bg-tertiary -translate-y-1/2 z-0 transition-all duration-700"
                    style={{ width: app.progressLineWidth || '45%' }}
                  ></div>

                  <div className="grid grid-cols-5 gap-2 relative z-10">
                    {app.milestones.map((m) => {
                      const isMilestoneCompleted = m.status === 'completed'
                      const isMilestoneActive = m.status === 'active'

                      return (
                        <div key={m.step} className={`flex flex-col items-center text-center ${m.status === 'pending' ? 'opacity-70' : ''}`}>
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs ${
                              isMilestoneCompleted
                                ? 'bg-tertiary text-on-tertiary'
                                : isMilestoneActive
                                ? 'bg-secondary-container text-on-secondary shadow-md animate-bounce'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {isMilestoneCompleted ? (
                              <span className="material-symbols-outlined text-lg">check</span>
                            ) : isMilestoneActive ? (
                              <span className="material-symbols-outlined text-lg">fact_check</span>
                            ) : (
                              <span className="font-title-sm text-title-sm font-bold">{m.step}</span>
                            )}
                          </div>
                          <span
                            className={`font-title-sm text-title-sm font-semibold mt-2.5 ${
                              isMilestoneActive ? 'text-secondary font-bold' : isMilestoneCompleted ? 'text-on-surface' : 'text-on-surface-variant'
                            }`}
                          >
                            {m.title}
                          </span>
                          <span
                            className={`font-label-sm text-label-sm ${
                              isMilestoneActive ? 'text-secondary font-bold' : isMilestoneCompleted ? 'text-tertiary font-medium' : 'text-outline'
                            }`}
                          >
                            {m.date}
                          </span>
                          <span className="font-body-sm text-[11px] leading-tight text-on-surface-variant mt-0.5">
                            {m.sub}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mobile Vertical Stepper View */}
                <div className="flex flex-col gap-space-sm md:hidden py-space-xs">
                  {app.milestones.map((m) => {
                    const isMilestoneCompleted = m.status === 'completed'
                    const isMilestoneActive = m.status === 'active'

                    return (
                      <div
                        key={m.step}
                        className={`flex items-start gap-3 p-2 rounded-lg ${
                          isMilestoneActive ? 'bg-secondary-container/10' : m.status === 'pending' ? 'opacity-60' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isMilestoneCompleted
                              ? 'bg-tertiary text-on-tertiary'
                              : isMilestoneActive
                              ? 'bg-secondary-container text-on-secondary'
                              : 'bg-surface-container-high text-on-surface-variant font-bold font-label-md'
                          }`}
                        >
                          {isMilestoneCompleted ? (
                            <span className="material-symbols-outlined text-sm">check</span>
                          ) : isMilestoneActive ? (
                            <span className="material-symbols-outlined text-sm">fact_check</span>
                          ) : (
                            <span>{m.step}</span>
                          )}
                        </div>
                        <div>
                          <div
                            className={`font-title-sm text-title-sm font-semibold ${
                              isMilestoneActive ? 'text-secondary font-bold' : 'text-on-surface'
                            }`}
                          >
                            {m.title} ({m.date})
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{m.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Nodal Officer Note Callout */}
                {app.officerNote && (
                  <div className="rounded-lg bg-surface-container-high/60 p-space-md flex items-start gap-space-sm border border-outline-variant/20">
                    <div className="p-2 rounded-lg bg-primary text-on-primary shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">sticky_note_2</span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-label-sm text-label-sm font-bold text-primary uppercase tracking-wider">
                          Official Log Note / अधिकारी टिप्पणी
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Recorded: {app.officerNoteDate}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface mt-1 leading-relaxed">
                        {app.officerNote}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-label-sm text-label-sm text-secondary font-bold">
                          — {app.nodalOfficer}, {app.officerRole}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-semibold">
                          Digitally Signed
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disbursed Account Footnote for Completed Applications */}
                {isCompleted && (
                  <div className="px-space-md py-space-sm bg-surface-container-low rounded-lg flex flex-wrap items-center gap-x-space-lg gap-y-2 text-on-surface-variant font-body-sm text-body-sm border border-outline-variant/20">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-tertiary text-base">account_balance</span>
                      <span>Beneficiary A/c: <strong>{app.bankAccount}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">credit_score</span>
                      <span>UTR / Ref No: <strong>{app.utrNumber}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">workspace_premium</span>
                      <span>Training Credential: <strong>{app.credential}</strong></span>
                    </div>
                  </div>
                )}

                {/* Primary Action Buttons Rail */}
                <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-sm border-t border-outline-variant/20">
                  <div className="flex flex-wrap items-center gap-space-sm">
                    <button
                      className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-title-sm text-title-sm font-semibold flex items-center gap-2 hover:bg-primary-container transition-all duration-200 shadow-xs cursor-pointer"
                      onClick={() => setSelectedAppModal(app)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      <span>View Submitted Form</span>
                    </button>
                    {!isCompleted && (
                      <button
                        className="px-4 py-2.5 rounded-lg bg-surface-container-highest text-primary font-title-sm text-title-sm font-semibold flex items-center gap-2 hover:bg-surface-dim transition-all duration-200 cursor-pointer"
                        onClick={() =>
                          showToast(
                            'Supplementary Upload Portal Active',
                            'Please choose the invoice or bank passbook scan (PDF/JPEG up to 5MB).'
                          )
                        }
                        type="button"
                      >
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        <span>Upload Additional Bill / Document</span>
                      </button>
                    )}
                  </div>
                  <button
                    className="px-4 py-2.5 rounded-lg bg-surface-container text-on-surface-variant font-title-sm text-title-sm font-semibold flex items-center gap-2 hover:text-on-surface hover:bg-surface-container-high transition-all duration-200 cursor-pointer"
                    onClick={() =>
                      showToast(
                        'Acknowledgement Slip Downloaded',
                        `Official Acknowledgement Slip #${app.id} saved in institutional record.`
                      )
                    }
                    type="button"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    <span>Download Acknowledgement Receipt (PDF)</span>
                  </button>
                </div>
              </div>
            </section>
          )
        })}
        </div>
      )}

      {/* Interactive Modal: View Submitted Form */}
      {selectedAppModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-space-md">
          <div className="w-full max-w-2xl max-h-[90vh] bg-surface-container-lowest rounded-xl shadow-xl flex flex-col overflow-hidden animate-in fade-in">
            <div className="p-space-md bg-primary text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">description</span>
                <span className="font-title-md text-title-md font-bold">
                  Application Record Preview (#{selectedAppModal.id})
                </span>
              </div>
              <button
                className="w-8 h-8 rounded-lg hover:bg-on-primary/20 flex items-center justify-center text-on-primary cursor-pointer transition-all duration-200"
                onClick={() => setSelectedAppModal(null)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-space-lg overflow-y-auto flex flex-col gap-space-md text-on-surface">
              <div className="p-3 rounded-lg bg-surface-container-low flex justify-between items-center">
                <span className="font-label-md text-label-md text-on-surface-variant">Ministry Record Identifier</span>
                <span className="font-mono text-sm font-bold text-primary">MoSJE-UP-2025-{selectedAppModal.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-body-sm">
                <div className="p-2 rounded bg-surface-container-lowest shadow-xs border border-outline-variant/30">
                  <span className="font-label-sm text-outline block">Applicant Full Name</span>
                  <span className="font-semibold text-primary">{profile?.name || 'Applicant (Verified Citizen)'}</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest shadow-xs border border-outline-variant/30">
                  <span className="font-label-sm text-outline block">Caste / Category</span>
                  <span className="font-semibold text-primary">{profile?.caste_category || profile?.category || 'Scheduled Caste (SC)'}</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest shadow-xs border border-outline-variant/30">
                  <span className="font-label-sm text-outline block">Annual Household Income</span>
                  <span className="font-semibold text-primary">
                    {selectedAppModal.monthly_family_income
                      ? `${formatCurrency(Number(selectedAppModal.monthly_family_income) * 12)} (Certified)`
                      : `${formatCurrency(118000)} (Tahsildar Certified)`}
                  </span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest shadow-xs border border-outline-variant/30">
                  <span className="font-label-sm text-outline block">Proposed Activity</span>
                  <span className="font-semibold text-primary">{selectedAppModal.title}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-title-sm text-title-sm font-bold text-primary">Verified Attached Credentials</span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-body-sm">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-sm">check_circle</span>
                      Aadhaar Card (Masked eKYC)
                    </span>
                    <span className="font-label-sm text-tertiary font-bold">UIDAI Validated</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-body-sm">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-sm">check_circle</span>
                      State Caste Certificate (EDistrict UP)
                    </span>
                    <span className="font-label-sm text-tertiary font-bold">UP-EDIST-991204</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container-low text-body-sm">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-sm">check_circle</span>
                      Equipment Machinery Quotation / Income Slip
                    </span>
                    <span className="font-label-sm text-outline font-medium">GST Registered Vendor</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-space-md bg-surface-container-low flex justify-end gap-space-sm border-t border-outline-variant/20">
              <button
                className="px-4 py-2 rounded-lg bg-surface-container-highest text-primary font-title-sm text-title-sm cursor-pointer hover:bg-surface-dim transition-all duration-200"
                onClick={() => setSelectedAppModal(null)}
                type="button"
              >
                Close Preview
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-title-sm text-title-sm flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-primary-container transition-all duration-200"
                onClick={() => {
                  setSelectedAppModal(null)
                  showToast('Record Downloaded', `Application Record #${selectedAppModal.id} ready for print.`)
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">print</span> Print Application Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-space-md rounded-xl bg-primary text-on-primary shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-tertiary-fixed text-2xl">check_circle</span>
          <div className="flex flex-col">
            <span className="font-title-sm text-title-sm font-bold">{toastMessage.title}</span>
            <span className="font-body-sm text-body-sm text-primary-fixed-dim">{toastMessage.msg}</span>
          </div>
        </div>
      )}
    </div>
  )
}
