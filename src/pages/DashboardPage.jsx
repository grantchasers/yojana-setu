import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApplications } from '../hooks/useApplications'
import AppShell from '../components/layout/AppShell'
import { formatCurrency } from '../lib/formatCurrency'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { applications, loading } = useApplications(user?.id)

  const mostRecentApp = applications && applications.length > 0 ? applications[0] : null

  // Determine application stage details
  const appStatus = (mostRecentApp?.status || 'submitted').toLowerCase()
  const isDisbursed = appStatus === 'disbursed' || appStatus === 'completed'
  const isApproved = appStatus === 'approved' || appStatus === 'sanctioned'
  const isRouted = appStatus === 'routed'

  let stageBadgeText = 'Stage 1 of 4: Submitted'
  let currentStep = 1

  if (isDisbursed) {
    stageBadgeText = 'Stage 4 of 4: Disbursed'
    currentStep = 4
  } else if (isApproved) {
    stageBadgeText = 'Stage 3 of 4: Credit Sanctioned'
    currentStep = 3
  } else if (isRouted) {
    stageBadgeText = 'Stage 2 of 4: In Scrutiny'
    currentStep = 2
  }

  const appSchemeName =
    mostRecentApp?.scheme_name ||
    mostRecentApp?.schemes?.name ||
    mostRecentApp?.schemes?.title ||
    'Concessional Credit Scheme (MoSJE)'

  const appPartnerName =
    mostRecentApp?.partner_name ||
    mostRecentApp?.channel_partners?.name ||
    'State Channelising Agency (SCA)'

  const submissionDateFormatted = mostRecentApp?.created_at
    ? new Date(mostRecentApp.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent Submission'

  const formattedRef = mostRecentApp?.id
    ? String(mostRecentApp.id).startsWith('YS-')
      ? mostRecentApp.id
      : `YS-${String(mostRecentApp.id).slice(0, 8).toUpperCase()}`
    : 'Not Applied'

  return (
    <AppShell>
      <div className="px-gutter-lg py-space-lg flex flex-col w-full">
        {/* Verified Beneficiary Profile Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary-container to-primary p-gutter-lg text-on-primary shadow-sm mb-space-lg">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-surface-tint/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md relative z-10">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs text-on-primary-container font-label-md text-label-md uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Verified Beneficiary Profile • प्रमाणित लाभार्थी</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-primary tracking-tight">
                Namaste {profile?.name} / नमस्ते {profile?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-on-primary-container font-body-sm text-body-sm">
                <span>Application Ref: <strong className="text-on-primary tracking-wide">{mostRecentApp ? formattedRef : 'YS-NEW-CITIZEN'}</strong></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container" />
                <span>Category: <strong className="text-on-primary">{profile?.caste_category || profile?.category || 'Scheduled Caste Entrepreneur'}</strong></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container" />
                <span>State: <strong className="text-on-primary">{profile?.state || 'Uttar Pradesh (District: Lucknow)'}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-space-sm self-start lg:self-center">
              <button
                className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg shadow-sm hover:bg-surface-container-high transition-all duration-200"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                <span>Download Acknowledgement</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Application Status or EmptyState Prompt */}
        {loading ? (
          <div className="rounded-xl bg-surface-container-lowest p-gutter-lg shadow-sm mb-space-lg animate-pulse border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high" />
                <div className="flex flex-col gap-2">
                  <div className="w-24 h-3 bg-surface-container-high rounded" />
                  <div className="w-64 h-5 bg-surface-container-high rounded" />
                </div>
              </div>
              <div className="w-36 h-7 rounded-full bg-surface-container-high" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high" />
                  <div className="w-28 h-4 bg-surface-container-high rounded" />
                  <div className="w-36 h-3 bg-surface-container-high rounded" />
                </div>
              ))}
            </div>
            <div className="h-14 rounded-xl bg-surface-container-low" />
          </div>
        ) : mostRecentApp ? (
          <div className="rounded-xl bg-surface-container-lowest p-gutter-lg shadow-sm mb-space-lg border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Active Application Status • #{formattedRef}
                  </span>
                  <h2 className="font-title-lg text-title-lg text-primary font-bold">
                    {appSchemeName}
                  </h2>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md self-start sm:self-auto font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span>{stageBadgeText}</span>
              </div>
            </div>

            <div className="py-space-lg my-space-xs">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md relative">
                {/* Step 1 */}
                <div className="flex flex-col relative">
                  <div className="flex items-center gap-space-sm mb-2">
                    <div className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold text-sm z-10 shadow-sm">
                      <span className="material-symbols-outlined text-base">check</span>
                    </div>
                    <div className={`hidden md:block absolute left-8 top-4 right-0 h-1 ${currentStep >= 2 ? 'bg-tertiary' : 'bg-surface-container-highest'} -z-0`} />
                    <span className="font-title-sm text-title-sm text-on-surface font-semibold">1. Submitted</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant pl-10 md:pl-0">
                    {submissionDateFormatted} • Digital Submission
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col relative">
                  <div className="flex items-center gap-space-sm mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-sm ${
                      currentStep > 2
                        ? 'bg-tertiary text-on-tertiary'
                        : currentStep === 2
                        ? 'bg-primary text-on-primary ring-4 ring-primary-fixed'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {currentStep > 2 ? (
                        <span className="material-symbols-outlined text-base">check</span>
                      ) : (
                        <span>2</span>
                      )}
                    </div>
                    <div className={`hidden md:block absolute left-8 top-4 right-0 h-1 ${currentStep >= 3 ? 'bg-tertiary' : 'bg-surface-container-highest'} -z-0`} />
                    <span className={`font-title-sm text-title-sm ${currentStep === 2 ? 'text-primary font-bold' : currentStep > 2 ? 'text-on-surface' : 'text-outline'}`}>
                      2. Document Verification
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant pl-10 md:pl-0">
                    {currentStep >= 2 ? `Active at ${appPartnerName}` : 'Pending Routing'}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col relative">
                  <div className="flex items-center gap-space-sm mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 ${
                      currentStep > 3
                        ? 'bg-tertiary text-on-tertiary shadow-sm'
                        : currentStep === 3
                        ? 'bg-primary text-on-primary ring-4 ring-primary-fixed shadow-sm'
                        : 'bg-surface-container-high text-outline'
                    }`}>
                      {currentStep > 3 ? (
                        <span className="material-symbols-outlined text-base">check</span>
                      ) : (
                        <span>3</span>
                      )}
                    </div>
                    <div className={`hidden md:block absolute left-8 top-4 right-0 h-1 ${currentStep >= 4 ? 'bg-tertiary' : 'bg-surface-container-highest'} -z-0`} />
                    <span className={`font-title-sm text-title-sm ${currentStep === 3 ? 'text-primary font-bold' : currentStep > 3 ? 'text-on-surface' : 'text-outline'}`}>
                      3. Partner Sanction
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-outline pl-10 md:pl-0">
                    {currentStep >= 3 ? 'State Credit Committee' : 'Post-Verification Review'}
                  </p>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col relative">
                  <div className="flex items-center gap-space-sm mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 ${
                      currentStep === 4
                        ? 'bg-tertiary text-on-tertiary shadow-sm'
                        : 'bg-surface-container-high text-outline'
                    }`}>
                      {currentStep === 4 ? (
                        <span className="material-symbols-outlined text-base">check</span>
                      ) : (
                        <span>4</span>
                      )}
                    </div>
                    <span className={`font-title-sm text-title-sm ${currentStep === 4 ? 'text-tertiary font-bold' : 'text-outline'}`}>
                      4. Disbursement
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-outline pl-10 md:pl-0">
                    Direct Benefit Transfer (DBT)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-space-md p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">schedule</span>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                    {currentStep >= 2
                      ? `In Processing at ${appPartnerName}`
                      : 'Digital Application Received on MoSJE Portal'}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {currentStep >= 2
                      ? 'Nodal agency SLA active. Expected review within standard turnaround window.'
                      : 'File queued for initial screening and channel partner allocation.'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm shrink-0">
                <NavLink
                  to="/applications"
                  className="px-space-md py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all duration-200 inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                  <span>View All Applications</span>
                </NavLink>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-lowest p-gutter-lg shadow-sm mb-space-lg border border-outline-variant/30 flex flex-col items-center justify-center text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mb-space-md">
              <span className="material-symbols-outlined text-3xl">smart_toy</span>
            </div>
            <h2 className="font-title-lg text-title-lg text-primary font-bold mb-1">
              No Active Applications Found / कोई सक्रिय आवेदन नहीं
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mb-space-lg">
              You have not submitted any scheme applications yet. Discover eligible central schemes, subsidized interest rates, and capital grants with our 2-minute AI Recommender.
            </p>
            <NavLink
              to="/recommender"
              className="inline-flex items-center gap-2 px-space-lg py-3 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all duration-200"
            >
              <span className="material-symbols-outlined text-xl">rocket_launch</span>
              <span>Start Scheme Recommender (योजना सिफारिश शुरू करें)</span>
            </NavLink>
          </div>
        )}

        {/* Quick-Launch Financial Tools (NavLink-wrapped cards) */}
        <div className="mb-space-lg">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary">Quick-Launch Financial Tools</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Access self-service assistance, compute subsidies, and identify physical desks
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-bold">
              Self-Service Utility
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {/* Card 1: Scheme Recommender */}
            <NavLink
              to="/recommender"
              className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 group block"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center mb-space-md group-hover:scale-105 transition-transform duration-200">
                  <span className="material-symbols-outlined text-2xl">smart_toy</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-primary mb-1">Scheme Recommender</h3>
                <p className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider mb-space-sm">
                  योजना सिफारिश टूल
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
                  Find eligible schemes based on your project cost, trade, and family income in under 2 minutes with zero paperwork.
                </p>
              </div>
              <div className="inline-flex items-center justify-center gap-2 w-full py-3 px-space-md rounded-lg bg-primary text-on-primary font-label-lg text-label-lg group-hover:bg-primary-container transition-all duration-200">
                <span>Find Matching Schemes</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </div>
            </NavLink>

            {/* Card 2: EMI Calculator */}
            <NavLink
              to="/calculator"
              className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 group block"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center mb-space-md group-hover:scale-105 transition-transform duration-200">
                  <span className="material-symbols-outlined text-2xl">calculate</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-primary mb-1">EMI Calculator</h3>
                <p className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider mb-space-sm">
                  ईएमआई कैलकुलेटर
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
                  Plan your monthly repayments with subsidized interest rates (4%-7%) and custom moratorium grace periods.
                </p>
              </div>
              <div className="inline-flex items-center justify-center gap-2 w-full py-3 px-space-md rounded-lg bg-surface-container-high text-primary font-label-lg text-label-lg group-hover:bg-surface-container-highest transition-all duration-200">
                <span>Calculate Repayment EMI</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </div>
            </NavLink>

            {/* Card 3: Channel Partner Locator */}
            <NavLink
              to="/locator"
              className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 group block"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mb-space-md group-hover:scale-105 transition-transform duration-200">
                  <span className="material-symbols-outlined text-2xl">storefront</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-primary mb-1">Channel Partner Locator</h3>
                <p className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider mb-space-sm">
                  पार्टनर बैंक खोजें
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
                  Locate 14 active bank branches and SCA verification counters near your Lucknow tehsil accepting direct documents.
                </p>
              </div>
              <div className="inline-flex items-center justify-center gap-2 w-full py-3 px-space-md rounded-lg bg-surface-container-high text-primary font-label-lg text-label-lg group-hover:bg-surface-container-highest transition-all duration-200">
                <span>View Nearby Partners</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Understanding Your Entitlement */}
        <div className="rounded-xl bg-surface-container p-gutter-lg shadow-sm mb-space-lg">
          <div className="flex items-start gap-space-md">
            <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">lightbulb</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md text-primary font-bold">
                  Understanding Your Entitlement (अधिकारिता स्पष्टीकरण)
                </span>
                <span className="px-2 py-0.5 rounded bg-tertiary text-on-tertiary font-label-sm text-label-sm">
                  MoSJE Sovereign Backed
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
                Under MoSJE &amp; NSFDC guidelines, concessional credit provides up to <strong>90% project cost</strong> with zero collateral for enterprise loans up to <strong>{formatCurrency(500000)}</strong>. Capital subsidies are directly credited via DBT to protect you from predatory microfinance debt.
              </p>
            </div>
          </div>
        </div>

        {/* Document Readiness Checklist & Recent Agency Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="flex items-center justify-between mb-space-md">
                <h2 className="font-title-lg text-title-lg text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">inventory</span>
                  <span>Document Readiness Checklist</span>
                </h2>
                <span className="font-label-md text-label-md text-tertiary font-bold">3 of 3 Verified / Ready</span>
              </div>
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-space-md">
                    <span className="material-symbols-outlined text-tertiary text-2xl">check_circle</span>
                    <div className="flex flex-col">
                      <span className="font-title-sm text-title-sm text-on-surface">
                        Aadhaar Card Linked to Mobile
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        UIDAI e-KYC Verified on 10 Feb 2025
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-tertiary font-bold">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-space-md">
                    <span className="material-symbols-outlined text-tertiary text-2xl">check_circle</span>
                    <div className="flex flex-col">
                      <span className="font-title-sm text-title-sm text-on-surface">
                        Caste Certificate (SC/ST/OBC)
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Verified via DigiLocker Repository (UP Borad)
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-tertiary font-bold">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-low">
                  <div className="flex items-center gap-space-md">
                    <span className="material-symbols-outlined text-tertiary text-2xl">task_alt</span>
                    <div className="flex flex-col">
                      <span className="font-title-sm text-title-sm text-on-surface">
                        Project Machinery Quotation
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Uploaded: {formatCurrency(480000)} for Small Scale Textile
                      </span>
                    </div>
                  </div>
                  <button
                    className="text-primary hover:text-secondary font-label-sm text-label-sm font-bold flex items-center gap-1 transition-all duration-200"
                    type="button"
                  >
                    <span>View</span>
                    <span className="material-symbols-outlined text-sm">visibility</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-space-md">
                  <h2 className="font-title-lg text-title-lg text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">notifications_active</span>
                    <span>Recent Agency Notices</span>
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                </div>
                <div className="space-y-space-md">
                  <div className="p-space-sm rounded-lg bg-surface-container-high/40">
                    <div className="flex items-center justify-between text-outline font-label-sm text-label-sm mb-1">
                      <span>Uttar Pradesh SC/ST Dev Corp (UPSCFDC)</span>
                      <span>Yesterday</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      Physical verification camp scheduled for Lucknow Sadar Tehsil on Feb 22, 2025. Ensure original revenue land receipts are kept handy if applicable.
                    </p>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container-high/40">
                    <div className="flex items-center justify-between text-outline font-label-sm text-label-sm mb-1">
                      <span>Central Ministry Notification</span>
                      <span>11 Feb 2025</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      Annual interest subvention ceiling revised to 3.5% across scheduled micro-enterprises under the 2025 Welfare Allocation Directive.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-space-md pt-space-md bg-surface-container-lowest">
                <div className="flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Need desk assistance?</span>
                  <NavLink
                    to="/help"
                    className="text-secondary hover:underline font-label-md text-label-md font-bold flex items-center gap-1 transition-all duration-200"
                    data-path="help-guidelines"
                  >
                    <span>Find Facilitator</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Footer */}
      <footer className="w-full bg-surface-container-lowest py-space-sm px-gutter-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)] mt-auto">
        <div className="flex flex-wrap items-center justify-between text-on-surface-variant text-label-sm font-label-sm gap-space-md">
          <div>Official portal of the Ministry of Social Justice &amp; Empowerment • Government of India</div>
          <div className="flex items-center gap-space-md">
            <span className="inline-flex items-center gap-1 text-tertiary">
              <span className="material-symbols-outlined text-base">verified_user</span> Certified Data Privacy
            </span>
            <span>Helpline: 1800-11-7788</span>
            <span>Accessibility / Screen Reader Compliant</span>
          </div>
        </div>
      </footer>
    </AppShell>
  )
}
