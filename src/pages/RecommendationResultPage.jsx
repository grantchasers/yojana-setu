import { useState, useMemo } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { formatCurrency } from '../lib/formatCurrency'
import { SCHEMES } from '../lib/recommendationEngine'
import { useAuth } from '../context/AuthContext'
import { useApplications } from '../hooks/useApplications'

export default function RecommendationResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const user = auth?.user
  const { createApplication } = useApplications(user?.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // State to track accordion expansion for alternative schemes
  const [expandedAlt, setExpandedAlt] = useState({ alt1: false, alt2: false })

  const toggleAlt = (key) => {
    setExpandedAlt((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Safe extraction of router state
  const state = location.state
  const hasValidState = Boolean(state?.result || state?.answers)
  const result = state?.result || {}
  const answers = state?.answers || {}

  // Resolve scheme key and scheme definition
  const schemeKey = result.schemeKey || result.scheme || 'term_loan'
  const schemeDef = SCHEMES[schemeKey] || SCHEMES.term_loan
  const schemeId = result.schemeId || result.scheme_id || result.id || schemeDef?.id || schemeKey

  const schemeName = result.schemeName || schemeDef.title
  const schemeNameHi = result.schemeNameHi || schemeDef.titleHi
  const agency = result.agency || schemeDef.agency
  const schemeCode = result.code || schemeDef.code || 'MoSJE-GOI'

  // Numerical parameters
  const numericCost = Number(answers.projectCost) || 0
  const numericIncome = Number(answers.monthlyFamilyIncome) || 0
  const annualIncome = answers.annualFamilyIncome || numericIncome * 12

  // Determine loan allocation ratio and amounts
  const loanRatioPct = schemeKey === 'micro_finance' ? 95 : 90
  const promoterRatioPct = 100 - loanRatioPct

  const suggestedAmount = useMemo(() => {
    if (numericCost > 0) {
      const calculated = Math.round((numericCost * loanRatioPct) / 100)
      const max = schemeDef.maxAmount || 500000
      return Math.min(calculated, max)
    }
    return 135000
  }, [numericCost, loanRatioPct, schemeDef.maxAmount])

  const promoterContribution = Math.max(0, numericCost - suggestedAmount)

  // Interest rate range
  const interestRateRange = result.interestRate || schemeDef.interestRate || '4.0% - 6.0%'

  // Moratorium range based on scheme
  const moratoriumRange = useMemo(() => {
    if (schemeKey === 'micro_finance') return '3 - 6 Months'
    if (schemeKey === 'education_loan') return 'Course duration + 1 Year'
    return '6 - 9 Months'
  }, [schemeKey])

  // Repayment tenure description
  const tenureDisplay = useMemo(() => {
    if (schemeKey === 'micro_finance') return '36 Monthly Installments'
    if (schemeKey === 'education_loan') return 'Post-course moratorium installments'
    return '60 Monthly Installments'
  }, [schemeKey])

  // Plain-language reasoning sentence built directly from answers
  const reasoningSentence = useMemo(() => {
    const formattedCost = formatCurrency(numericCost)
    const formattedIncome = formatCurrency(numericIncome)
    const formattedAnnual = formatCurrency(annualIncome)
    const trade = answers.projectType || 'Small trade/business'
    const education = answers.educationStatus || '10th Pass'

    if (!result.eligible) {
      return `Based on your submitted monthly family income of ${formattedIncome} (Annual: ${formattedAnnual}), your household income exceeds the statutory ${formatCurrency(500000)} annual ceiling for MoSJE concessional welfare credit. However, you remain eligible for Mudra and standard MSME lending channels.`
    }

    return `Based on your proposed venture in ${trade} with an estimated project cost of ${formattedCost}, a monthly family income of ${formattedIncome} (Annual: ${formattedAnnual}), and educational qualification of ${education}, you qualify for ${schemeName}. Under statutory MoSJE guidelines, this offers ${loanRatioPct}% concessional credit (${formatCurrency(suggestedAmount)}) at ${interestRateRange} subsidized interest with a ${moratoriumRange} moratorium grace window, requiring only a ${promoterRatioPct}% (${formatCurrency(promoterContribution)}) self-contribution.`
  }, [
    result.eligible,
    numericCost,
    numericIncome,
    annualIncome,
    answers.projectType,
    answers.educationStatus,
    schemeName,
    loanRatioPct,
    suggestedAmount,
    interestRateRange,
    moratoriumRange,
    promoterRatioPct,
    promoterContribution,
  ])

  // Navigation handlers
  const handleCalculateEMI = () => {
    // Determine interest rate bounds for the calculator slider
    let minRate = 4.0
    let maxRate = 6.0
    if (schemeKey === 'micro_finance') {
      minRate = 4.0
      maxRate = 5.0
    } else if (schemeKey === 'education_loan') {
      minRate = 3.5
      maxRate = 4.0
    }

    navigate('/calculator', {
      state: {
        schemeId: schemeKey,
        suggestedAmount,
        scheme: {
          id: schemeKey,
          title: schemeName,
          name: schemeName,
          code: schemeCode,
          interestRate: interestRateRange,
          interest_rate_min: minRate,
          interest_rate_max: maxRate,
          min_amount: 20000,
          max_amount: schemeDef.maxAmount || 500000,
          moratorium: moratoriumRange,
        },
        answers,
      },
    })
  }

  const handleFindPartner = () => {
    navigate('/locator', {
      state: {
        schemeType: schemeKey,
        schemeName,
      },
    })
  }

  const handleSubmitApplication = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await createApplication({
        schemeId,
        ...answers,
      })

      if (res?.error) {
        const errorMsg =
          res.error?.message ||
          (typeof res.error === 'string' ? res.error : null) ||
          'Failed to submit application. Please try again.'
        setSubmitError(errorMsg)
        setIsSubmitting(false)
        return
      }

      setIsSubmitting(false)
      navigate('/applications')
    } catch (err) {
      const errorMsg =
        err?.message ||
        (typeof err === 'string' ? err : null) ||
        'Failed to submit application. Please try again.'
      setSubmitError(errorMsg)
      setIsSubmitting(false)
    }
  }

  // Guard check: redirect to /recommender if state is missing
  if (!hasValidState) {
    return <Navigate to="/recommender" replace />
  }

  return (
    <div className="px-gutter-lg py-space-lg flex flex-col w-full min-h-[calc(100vh-4rem)] justify-between">
      <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 space-y-8">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-md text-label-md">
              <span className="material-symbols-outlined text-base text-tertiary">verified</span>
              <span>Verified Analysis • संदर्भ ID: REC-2025-UP-9841</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              Your Scheme Match Results{' '}
              <span className="font-normal text-on-surface-variant text-title-lg">
                / आपकी पात्रता के अनुसार चयनित योजना
              </span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Transparent, rule-based algorithmic verification according to Ministry of Social
              Justice and Empowerment (MoSJE) operational guidelines.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md shadow-sm transition-all duration-200 cursor-pointer"
              onClick={() => window.print()}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              <span>Print Report (प्रिंट)</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md shadow-sm transition-all duration-200 cursor-pointer"
              onClick={() => alert('PDF report generation initialized.')}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>PDF Summary</span>
            </button>
          </div>
        </div>

        {/* Evaluation Summary Banner (Navy Hero) */}
        <div className="relative overflow-hidden rounded-xl bg-primary text-on-primary p-6 shadow-md">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-primary-container opacity-40 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-on-primary">recommend</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider">
                  Evaluation Complete • मूल्यांकन संपन्न
                </span>
                <p className="font-title-md text-title-md text-on-primary mt-0.5">
                  Based on your project (
                  <span className="text-secondary-fixed">
                    {answers.projectType || 'Retail & Trade'}, {formatCurrency(numericCost)}
                  </span>
                  ) and profile parameters, you have{' '}
                  <strong className="underline decoration-secondary">1 Top Match</strong> and 2
                  Alternative Schemes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 bg-primary-container/80 px-4 py-2.5 rounded-lg backdrop-blur-sm self-start md:self-auto">
              <span className="material-symbols-outlined text-tertiary-fixed text-xl">
                account_balance
              </span>
              <div className="text-left">
                <div className="font-label-sm text-label-sm text-primary-fixed-dim">
                  Eligible Credit Line
                </div>
                <div className="font-title-sm text-title-sm text-on-primary font-bold">
                  {formatCurrency(suggestedAmount)} Sanctionable
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ineligible Notice if Ceiling Exceeded */}
        {!result.eligible && (
          <div className="p-6 rounded-xl bg-error-container text-on-error-container shadow-sm border border-error/20">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-error text-3xl">error</span>
              <h2 className="font-title-lg text-title-lg text-error font-bold">
                Annual Family Income Exceeds Statutory Ceiling ({formatCurrency(500000)})
              </h2>
            </div>
            <p className="font-body-md text-body-md leading-relaxed">
              Under statutory MoSJE guidelines, concessional loans with 4%–6% subsidized interest
              are reserved for families with total annual household earnings within {formatCurrency(500000)}. For
              higher earnings, consider Pradhan Mantri MUDRA Yojana (PMMY) or Stand-Up India at
              standard bank interest rates.
            </p>
          </div>
        )}

        {/* Main Recommendation Result Card */}
        <div className="relative rounded-xl bg-surface-container-lowest shadow-md overflow-hidden text-left">
          <div className="h-2 w-full bg-secondary-container" />
          <div className="p-6 md:p-8 space-y-6">
            {/* Header row: Match badge + Scheme Name + Cost allocation ratio */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary text-tertiary-fixed font-label-md text-label-md">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    {result.eligible ? '100% Eligibility Match (पूर्णतः पात्र)' : 'Welfare Ceiling Advisory'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                    MoSJE / NSFDC Official Scheme
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                    Code: {schemeCode}
                  </span>
                </div>

                <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                  {schemeName}
                  {schemeNameHi && (
                    <span className="block font-title-md text-title-md text-on-surface-variant font-normal mt-0.5">
                      {schemeNameHi}
                    </span>
                  )}
                </h2>
                <p className="font-label-md text-label-md text-secondary font-semibold">
                  Sponsoring Agency: {agency}
                </p>
              </div>

              {/* Cost Allocation Ratio Gauge */}
              <div className="w-full lg:w-72 p-4 rounded-xl bg-surface-container-low shrink-0 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Cost Allocation Ratio
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-bold">
                    {loanRatioPct}% : {promoterRatioPct}%
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${loanRatioPct}%` }}
                    title={`Govt/SCA Loan Contribution: ${loanRatioPct}%`}
                  />
                  <div
                    className="bg-secondary-container h-full transition-all"
                    style={{ width: `${promoterRatioPct}%` }}
                    title={`Promoter Contribution: ${promoterRatioPct}%`}
                  />
                </div>
                <div className="flex justify-between text-left font-label-sm text-label-sm pt-1">
                  <div>
                    <span className="block text-primary font-bold">
                      {formatCurrency(suggestedAmount)} ({loanRatioPct}%)
                    </span>
                    <span className="text-on-surface-variant">Concessional Loan</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-secondary font-bold">
                      {formatCurrency(promoterContribution)} ({promoterRatioPct}%)
                    </span>
                    <span className="text-on-surface-variant">Self Contribution</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plain-language reasoning box built from answers */}
            <div className="rounded-xl bg-surface-container-low p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-xl text-secondary">
                  psychology_alt
                </span>
                <h3 className="font-title-sm text-title-sm uppercase tracking-wide font-bold">
                  Why this matched your profile / चयन का आधार एवं स्पष्टीकरण
                </h3>
              </div>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                {reasoningSentence}
              </p>
              {result.reason && (
                <p className="font-body-sm text-body-sm text-on-surface-variant italic border-l-2 border-primary/40 pl-3">
                  {result.reason}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-label-md text-label-md text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">task_alt</span>
                  <span>Target demographic &amp; category met</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">task_alt</span>
                  <span>Sector fully notified under MoSJE rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-base">task_alt</span>
                  <span>SCA channel active with zero collateral</span>
                </div>
              </div>
            </div>

            {/* 5 Financial Metric Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Metric 1: Concessional Interest */}
              <div className="p-4 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Concessional Interest
                </span>
                <div className="mt-2">
                  <div className="font-headline-sm text-headline-sm text-primary font-bold">
                    {interestRateRange}
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">
                    vs Bank 12-14%
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 pt-2 bg-surface-container-high/40 rounded px-1.5 py-0.5">
                  Subsidy embedded
                </span>
              </div>

              {/* Metric 2: Sanction Amount */}
              <div className="p-4 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Sanction Amount
                </span>
                <div className="mt-2">
                  <div className="font-headline-sm text-headline-sm text-primary font-bold">
                    {formatCurrency(suggestedAmount)}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Max up to {schemeDef.maxAmountFormatted || '₹5.0L'}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 pt-2 bg-surface-container-high/40 rounded px-1.5 py-0.5">
                  Direct to Bank/Vendor
                </span>
              </div>

              {/* Metric 3: Moratorium Period */}
              <div className="p-4 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Moratorium Period
                </span>
                <div className="mt-2">
                  <div className="font-headline-sm text-headline-sm text-primary font-bold">
                    {moratoriumRange}
                  </div>
                  <span className="font-label-sm text-label-sm text-tertiary font-medium">
                    ईएमआई छूट अवधि
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 pt-2 bg-surface-container-high/40 rounded px-1.5 py-0.5">
                  Setup grace window
                </span>
              </div>

              {/* Metric 4: Repayment Tenure */}
              <div className="p-4 rounded-xl bg-surface-container flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Repayment Tenure
                </span>
                <div className="mt-2">
                  <div className="font-headline-sm text-headline-sm text-primary font-bold">
                    {schemeKey === 'micro_finance' ? 'Up to 3 Years' : 'Up to 5 Years'}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {tenureDisplay}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 pt-2 bg-surface-container-high/40 rounded px-1.5 py-0.5">
                  Flexible prepayment
                </span>
              </div>

              {/* Metric 5: Security & Guarantee */}
              <div className="p-4 rounded-xl bg-surface-container flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Security &amp; Guarantee
                </span>
                <div className="mt-2">
                  <div className="font-title-md text-title-md text-primary font-bold">
                    Zero Collateral
                  </div>
                  <span className="font-label-sm text-label-sm text-tertiary font-medium">
                    कोई बंधक नहीं
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 pt-2 bg-surface-container-high/40 rounded px-1.5 py-0.5">
                  Assets hypothecated
                </span>
              </div>
            </div>

            {/* Profile Snapshot & Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary text-2xl shrink-0 mt-0.5">
                  info
                </span>
                <div className="text-on-surface space-y-1">
                  <h4 className="font-title-sm text-title-sm text-primary font-bold">
                    Project Profile Registered
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Target Activity: <strong>{answers.projectType}</strong>. Capital allocated for
                    machinery, working capital, inventory procurement, and operational setup.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">
                  assignment_turned_in
                </span>
                <div className="text-on-surface space-y-1">
                  <h4 className="font-title-sm text-title-sm text-primary font-bold">
                    Required Baseline Documents
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Aadhaar Card, Caste Certificate (जाति प्रमाण पत्र), Domicile Proof, Bank Passbook
                    (6 months active), and Quotation/Estimate of items.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Application Error Alert */}
            {submitError && (
              <div
                role="alert"
                className="p-4 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-3 border border-error/20"
              >
                <span className="material-symbols-outlined text-error text-xl shrink-0">error</span>
                <span className="flex-1 font-medium">{submitError}</span>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-on-error-container hover:opacity-70 cursor-pointer text-sm transition-all duration-200"
                  aria-label="Dismiss error"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            )}

            {/* Action Buttons: Find partner near me & Calculate my EMI & Submit Application */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-title-sm text-title-sm transition-all duration-200 shadow-sm cursor-pointer"
                onClick={handleFindPartner}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">near_me</span>
                <span>Find a partner near me (नजदीकी बैंक / SCA खोजें)</span>
              </button>

              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-secondary text-on-secondary hover:opacity-95 font-title-sm text-title-sm transition-all duration-200 shadow-md cursor-pointer"
                onClick={handleCalculateEMI}
                type="button"
              >
                <span>Calculate my EMI (ईएमआई कैलकुलेट करें)</span>
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>

              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed font-title-sm text-title-sm transition-all duration-200 shadow-md cursor-pointer"
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"
                      role="status"
                      aria-label="Loading"
                    />
                    <span>Submit this as my application</span>
                    <span className="sr-only">(Submitting...)</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">assignment_turned_in</span>
                    <span>Submit this as my application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Alternative & Complementary Schemes */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-title-lg text-title-lg text-primary">
                Alternative &amp; Complementary Schemes
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Explore other government credit linkages tailored for marginalized artisans and
                backward class entrepreneurs
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-bold">
              2 Options Available
            </span>
          </div>

          {/* Alternative Scheme 1: PM-DAKSH */}
          <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden transition-all duration-200">
            <div
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-all duration-200 hover:bg-surface-container-low"
              onClick={() => toggleAlt('alt1')}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-title-sm text-title-sm text-primary font-bold">
                      PM-DAKSH Credit Linkage Scheme
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                      Up to {formatCurrency(100000)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                      35% Subsidy
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Provides composite capital subsidy up to {formatCurrency(35000)} for certified micro-vendors,
                    artisans, and skill-trained youth under MoSJE.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <span className="font-label-md text-label-md text-primary font-bold">
                  View Eligibility &amp; Details
                </span>
                <span
                  className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${
                    expandedAlt.alt1 ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </div>
            </div>

            {expandedAlt.alt1 && (
              <div className="px-5 pb-5 pt-2 bg-surface-container-low space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-on-surface">
                  <div className="p-3 rounded-lg bg-surface-container-lowest">
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Maximum Financial Outlay
                    </div>
                    <div className="font-title-sm text-title-sm text-primary font-bold">{formatCurrency(100000)}</div>
                    <div className="font-label-sm text-label-sm text-tertiary">
                      35% non-refundable grant
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-lowest">
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Target Eligibility
                    </div>
                    <div className="font-title-sm text-title-sm text-primary font-bold">
                      PM-DAKSH Certified
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Prior skill certificate required
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-lowest">
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Lending Channels
                    </div>
                    <div className="font-title-sm text-title-sm text-primary font-bold">
                      Public Sector Banks / RRBs
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Direct Beneficiary Transfer
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Best if: You have completed certified retail or micro-entrepreneurship training
                    under Skill India / PM-DAKSH.
                  </span>
                  <button
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all duration-200 cursor-pointer"
                    onClick={() =>
                      navigate('/locator', { state: { schemeType: 'pm_daksh', schemeName: 'PM-DAKSH' } })
                    }
                    type="button"
                  >
                    Locate PM-DAKSH Centers
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Alternative Scheme 2: NBCFDC / Direct Lending */}
          <div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden transition-all duration-200">
            <div
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-all duration-200 hover:bg-surface-container-low"
              onClick={() => toggleAlt('alt2')}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-xl">groups_2</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-title-sm text-title-sm text-primary font-bold">
                      NBCFDC Micro Finance Scheme (Direct Lending via SCA)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                      Up to {formatCurrency(140000)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                      4.0% - 5.0% Simple p.a.
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Targeted for micro-units, self-help groups, and individual backward class
                    entrepreneurs requiring accelerated 7-day single-window verification.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <span className="font-label-md text-label-md text-primary font-bold">
                  View Eligibility &amp; Details
                </span>
                <span
                  className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${
                    expandedAlt.alt2 ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </div>
            </div>

            {expandedAlt.alt2 && (
              <div className="px-5 pb-5 pt-2 bg-surface-container-low space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-on-surface">
                  <div className="p-3 rounded-lg bg-surface-container-lowest">
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Max Loan Quantum
                    </div>
                    <div className="font-title-sm text-title-sm text-primary font-bold">
                      {formatCurrency(140000)}
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Single Window Fast Track
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-lowest">
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Rate to Beneficiary
                    </div>
                    <div className="font-title-sm text-title-sm text-primary font-bold">
                      4.0% - 5.0% per annum
                    </div>
                    <div className="font-label-sm text-label-sm text-tertiary">
                      Concessional simple rate
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-lowest">
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Repayment Window
                    </div>
                    <div className="font-title-sm text-title-sm text-primary font-bold">
                      36 Months
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      Quarterly moratorium of 3 mos.
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Best if: Seeking immediate working capital under {formatCurrency(140000)} without complex
                    formal balance sheet requirements.
                  </span>
                  <button
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all duration-200 cursor-pointer"
                    onClick={() =>
                      navigate('/calculator', {
                        state: {
                          schemeId: 'micro_finance',
                          suggestedAmount: Math.min(numericCost || 100000, 140000),
                          scheme: SCHEMES.micro_finance,
                          answers,
                        },
                      })
                    }
                    type="button"
                  >
                    Calculate Micro Finance EMI
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assistance / Support Helpdesk Strip */}
        <div className="rounded-xl bg-surface-container-low p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-highest text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <h4 className="font-title-sm text-title-sm text-primary font-bold">
                Need assistance verifying eligibility documents?
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Connect directly with your district Social Welfare Facilitator (जिला समाज कल्याण सहायक)
                for free on-ground document verification.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              className="px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md transition-all duration-200 shadow-sm cursor-pointer"
              onClick={handleFindPartner}
              type="button"
            >
              Find Local Facilitator
            </button>
            <a
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all duration-200"
              href="tel:1800117788"
            >
              <span className="material-symbols-outlined text-lg">call</span>
              <span>Call 1800-11-7788</span>
            </a>
          </div>
        </div>
      </div>

      {/* Official Footer */}
      <footer className="w-full bg-surface-container-lowest py-space-sm px-gutter-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)] mt-space-lg rounded-xl">
        <div className="flex flex-wrap items-center justify-between text-on-surface-variant text-label-sm font-label-sm gap-space-md">
          <div>
            Official portal of the Ministry of Social Justice &amp; Empowerment • Government of
            India
          </div>
          <div className="flex items-center gap-space-md">
            <span className="inline-flex items-center gap-1 text-tertiary">
              <span className="material-symbols-outlined text-base">verified_user</span> Certified Data
              Privacy
            </span>
            <span>Helpline: 1800-11-7788</span>
            <span>Accessibility / Screen Reader Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
