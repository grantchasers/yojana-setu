import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { calculateEMI, buildAmortizationSummary, formatRupees } from '../lib/emiCalculator'
import { SCHEMES } from '../lib/recommendationEngine'

export default function CalculatorPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // Read state if passed from recommendation result or other pages
  const passedState = location.state || {}
  const passedScheme =
    passedState.scheme ||
    (passedState.schemeId ? SCHEMES[passedState.schemeId] : null)

  const hasScheme = Boolean(passedScheme)

  // 1. Determine Scheme Bounds or Defaults
  const schemeMinAmount = hasScheme ? passedScheme.min_amount || 20000 : null
  const schemeMaxAmount = hasScheme
    ? passedScheme.max_amount || passedScheme.maxAmount || 500000
    : null

  const schemeMinRate = hasScheme
    ? passedScheme.interest_rate_min ?? 4.0
    : 6.5
  const schemeMaxRate = hasScheme
    ? passedScheme.interest_rate_max ?? 6.0
    : 15.0

  const schemeName = hasScheme
    ? passedScheme.title || passedScheme.name || 'NSFDC Term Loan Scheme (Micro Enterprise)'
    : 'General Subsidized Credit Window'

  const moratoriumText = hasScheme
    ? passedScheme.moratorium || '6-Month Setup Moratorium Included'
    : 'Standard Moratorium Grace Window'

  // 2. Local input state
  // Loan Amount: if scheme is passed, clamp initial amount to bounds; else free default
  const [loanAmount, setLoanAmount] = useState(() => {
    const raw = passedState.suggestedAmount ?? (hasScheme ? 135000 : 150000)
    if (hasScheme) {
      return Math.min(schemeMaxAmount, Math.max(schemeMinAmount, raw))
    }
    return raw
  })

  // Tenure Mode: 'years' vs 'months'
  const [tenureMode, setTenureMode] = useState('years')
  // Store tenure in months (e.g. 36 = 3 years)
  const [tenureMonths, setTenureMonths] = useState(36)

  // Interest rate slider clamped to scheme bounds or 6.5-15.0 default
  const [interestRate, setInterestRate] = useState(() => {
    if (hasScheme) {
      return 5.0 >= schemeMinRate && 5.0 <= schemeMaxRate
        ? 5.0
        : (schemeMinRate + schemeMaxRate) / 2
    }
    return 8.5
  })

  // 3. Live calculations using emiCalculator.js
  const summary = useMemo(() => {
    return buildAmortizationSummary({
      principal: loanAmount,
      annualRatePct: interestRate,
      tenureMonths,
    })
  }, [loanAmount, interestRate, tenureMonths])

  // Benchmark commercial bank comparison (e.g. 12.5% standard bank rate)
  const commercialRate = 12.5
  const commercialEMI = useMemo(() => {
    return calculateEMI({
      principal: loanAmount,
      annualRatePct: commercialRate,
      tenureMonths,
    })
  }, [loanAmount, tenureMonths])

  const commercialTotalPayable = commercialEMI * tenureMonths
  const commercialTotalInterest = Math.max(0, commercialTotalPayable - loanAmount)
  const interestSaved = Math.max(0, commercialTotalInterest - summary.totalInterest)

  // Handlers for Loan Amount
  const handleLoanInputChange = (e) => {
    const val = parseFloat(e.target.value) || 0
    if (hasScheme) {
      // Clamped to scheme's min/max
      if (val > schemeMaxAmount) {
        setLoanAmount(schemeMaxAmount)
      } else {
        setLoanAmount(val)
      }
    } else {
      // Free entry
      setLoanAmount(val)
    }
  }

  const handleLoanInputBlur = () => {
    if (hasScheme) {
      if (loanAmount < schemeMinAmount) {
        setLoanAmount(schemeMinAmount)
      } else if (loanAmount > schemeMaxAmount) {
        setLoanAmount(schemeMaxAmount)
      }
    }
  }

  const handleLoanSliderChange = (e) => {
    const val = parseFloat(e.target.value) || 0
    setLoanAmount(val)
  }

  // Handlers for Tenure
  const handleTenureYearsChange = (e) => {
    const years = parseInt(e.target.value, 10) || 1
    setTenureMonths(years * 12)
  }

  const handleTenureMonthsChange = (e) => {
    const m = parseInt(e.target.value, 10) || 12
    setTenureMonths(m)
  }

  // Handlers for Interest Rate
  const handleRateSliderChange = (e) => {
    const val = parseFloat(e.target.value)
    setInterestRate(val)
  }

  // Presets
  const presets = useMemo(() => {
    if (hasScheme && schemeMaxAmount <= 150000) {
      return [
        { label: '₹30,000', value: 30000 },
        { label: '₹60,000', value: 60000 },
        { label: '₹1,00,000', value: 100000 },
        { label: '₹1,40,000 (Max)', value: 140000 },
      ]
    }
    if (hasScheme) {
      return [
        { label: '₹50,000', value: 50000 },
        { label: '₹1,00,000', value: 100000 },
        { label: '₹1,35,000 (Std)', value: 135000 },
        { label: '₹2,50,000', value: 250000 },
        { label: '₹5,00,000 (Max)', value: 500000 },
      ]
    }
    return [
      { label: '₹50,000', value: 50000 },
      { label: '₹1,00,000', value: 100000 },
      { label: '₹2,50,000', value: 250000 },
      { label: '₹5,00,000', value: 500000 },
      { label: '₹10,00,000', value: 1000000 },
    ]
  }, [hasScheme, schemeMaxAmount])

  const tenureYears = Math.round((tenureMonths / 12) * 10) / 10

  const handleFindPartner = () => {
    navigate('/locator', {
      state: {
        schemeType: passedScheme?.id || 'term_loan',
        schemeName,
      },
    })
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  return (
    <div className="px-gutter-lg py-space-lg flex flex-col w-full min-h-[calc(100vh-4rem)] justify-between text-left">
      <div className="flex flex-col w-full">
        {/* Informational Banner / Trust Seal */}
        <div className="mb-space-lg flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-high px-gutter py-space-sm rounded-xl">
          <div className="flex items-center gap-space-sm">
            <span
              className="material-symbols-outlined text-secondary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              Official Statutory Rate Matrix: Fiscal Cycle 2024-25 | MoSJE Direct Lending Standard
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-tertiary">lock</span> Zero Hidden
              Processing Surcharges
            </span>
            <span className="font-label-sm text-label-sm bg-surface-container-lowest px-2.5 py-0.5 rounded-full text-primary font-bold">
              NSFDC Portal Audited
            </span>
          </div>
        </div>

        {/* Page Header Hierarchy */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mb-space-xl">
          <div className="flex flex-col max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-primary-container text-on-primary font-label-sm text-label-sm rounded-lg uppercase tracking-wider">
                Financial Literacy Engine
              </span>
              <span className="text-outline text-label-sm">•</span>
              <span className="font-label-sm text-label-sm text-secondary font-bold">
                MoSJE Welfare Window
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              Subsidized Loan EMI Calculator / रियायती ऋण ईएमआई कैलकुलेटर
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Pre-loaded with parameters for:{' '}
              <span className="font-title-sm text-title-sm text-primary font-bold">
                {schemeName}
              </span>
              . Adjust values below to tailor your monthly budget and verify government interest
              relief.
            </p>
          </div>

          {/* Quick Story / Micro Persona badge */}
          <div className="flex items-center gap-space-sm bg-surface-container p-space-sm rounded-xl">
            <img
              alt="Beneficiary Benchmark"
              className="w-11 h-11 rounded-full object-cover shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKpdxfdf4dK9DrTpTjdocJiursW4_FFqt2BDXUrAI2mZG35w16htuD6E0BgFtb3UfoT5qbPQWP2vQzs8elbYcmp4Ek9Lb7D0J-ugBOi6JYZ3sEzWDAlVOsMtpuIc795BayrOOWCi5-hnuJ4GMjGmZr6OHq_6hEfvZ3mMapTJT5HdvqBS2FA08bHn_eayD7yJVwvLtqFLLY1bljGpyjRCkSmh_3fvxw_HeoFqJ78JMZOsdqj_gLcbgp"
            />
            <div className="flex flex-col text-left">
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                Beneficiary Benchmark
              </span>
              <span className="font-title-sm text-title-sm text-primary font-bold">
                Village Micro-Units
              </span>
              <span className="font-label-sm text-label-sm text-tertiary font-bold">
                Standard Concessional Relief
              </span>
            </div>
          </div>
        </div>

        {/* Main Calculator Workspace: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
          {/* LEFT COLUMN: Parameter Controls & Real-Time Adjusters (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-space-lg">
            {/* Input Card 1: Loan Principal */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <label className="flex flex-col" htmlFor="loanInput">
                  <span className="font-title-md text-title-md text-primary font-bold">
                    1. Loan Amount (ऋण राशि)
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {hasScheme
                      ? `Scheme limits: ${formatRupees(schemeMinAmount)} – ${formatRupees(schemeMaxAmount)}`
                      : 'Capital grant & microfinance loan sanction limit (Free entry)'}
                  </span>
                </label>
                <div className="flex items-center bg-surface-container-high rounded-lg overflow-hidden shadow-inner">
                  <span className="px-3 py-2 font-title-sm text-title-sm text-primary font-bold bg-surface-container">
                    ₹
                  </span>
                  <input
                    className="w-36 px-3 py-2 font-title-md text-title-md font-bold text-primary bg-transparent text-right outline-none focus:bg-surface-container-highest transition-colors"
                    id="loanInput"
                    max={hasScheme ? schemeMaxAmount : undefined}
                    min={hasScheme ? schemeMinAmount : 1000}
                    step="5000"
                    type="number"
                    value={loanAmount || ''}
                    onChange={handleLoanInputChange}
                    onBlur={handleLoanInputBlur}
                  />
                </div>
              </div>

              {/* Slider with Rail & Markers */}
              <div className="flex flex-col gap-1.5 pt-1">
                <input
                  className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                  id="loanRange"
                  max={hasScheme ? schemeMaxAmount : 2500000}
                  min={hasScheme ? schemeMinAmount : 10000}
                  step="5000"
                  type="range"
                  value={loanAmount || 0}
                  onChange={handleLoanSliderChange}
                />
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>
                    Min: {formatRupees(hasScheme ? schemeMinAmount : 10000)}
                  </span>
                  <span className="font-bold text-primary">
                    Selected: {formatRupees(loanAmount)}
                  </span>
                  <span>
                    Max: {formatRupees(hasScheme ? schemeMaxAmount : 2500000)}
                  </span>
                </div>
              </div>

              {/* Preset Chips for Quick Access */}
              <div className="flex flex-wrap gap-2 pt-1 items-center">
                <span className="font-label-sm text-label-sm text-outline self-center mr-1">
                  Quick Select:
                </span>
                {presets.map((preset) => {
                  const isSelected = loanAmount === preset.value
                  return (
                    <button
                      key={preset.value}
                      className={`px-2.5 py-1 text-label-sm font-label-sm rounded-lg font-bold transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-primary-fixed text-on-primary-fixed ring-2 ring-primary/20'
                          : 'bg-surface-container hover:bg-surface-container-high text-primary'
                      }`}
                      onClick={() => setLoanAmount(preset.value)}
                      type="button"
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Input Card 2: Loan Tenure & Moratorium Structure */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-primary font-bold">
                    2. Loan Tenure (ऋण अवधि)
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Scheduled repayment horizon
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
                  <button
                    className={`px-3 py-1 text-label-sm font-label-sm rounded-lg font-bold transition-all duration-200 shadow-sm cursor-pointer ${
                      tenureMode === 'years'
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    onClick={() => setTenureMode('years')}
                    type="button"
                  >
                    Years / वर्ष
                  </button>
                  <button
                    className={`px-3 py-1 text-label-sm font-label-sm rounded-lg font-bold transition-all duration-200 shadow-sm cursor-pointer ${
                      tenureMode === 'months'
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    onClick={() => setTenureMode('months')}
                    type="button"
                  >
                    Months / महीने
                  </button>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-primary font-bold leading-none">
                    {tenureMode === 'years' ? tenureYears : tenureMonths}
                  </span>
                  <span className="font-title-md text-title-md text-on-surface-variant font-bold">
                    {tenureMode === 'years'
                      ? `Years (${tenureMonths} Months)`
                      : `Months (${tenureYears} Years)`}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded-lg font-bold">
                  Flexible Prepayment
                </span>
              </div>

              {/* Slider for Tenure */}
              {tenureMode === 'years' ? (
                <div className="flex flex-col gap-1.5">
                  <input
                    className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                    id="tenureRange"
                    max="5"
                    min="1"
                    step="1"
                    type="range"
                    value={Math.min(5, Math.max(1, Math.round(tenureMonths / 12)))}
                    onChange={handleTenureYearsChange}
                  />
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>1 Year (12M)</span>
                    <span>2 Years</span>
                    <span className="font-bold text-primary">3 Years (Standard)</span>
                    <span>4 Years</span>
                    <span>5 Years (60M)</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <input
                    className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                    id="tenureMonthsRange"
                    max="60"
                    min="6"
                    step="6"
                    type="range"
                    value={tenureMonths}
                    onChange={handleTenureMonthsChange}
                  />
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>6 Months</span>
                    <span>18 Months</span>
                    <span className="font-bold text-primary">36 Months</span>
                    <span>48 Months</span>
                    <span>60 Months</span>
                  </div>
                </div>
              )}

              {/* Moratorium Clarification Callout */}
              <div className="flex items-start gap-space-sm bg-surface-container-low p-space-sm rounded-xl">
                <span className="material-symbols-outlined text-secondary-container mt-0.5">
                  hourglass_bottom
                </span>
                <div className="flex flex-col">
                  <div className="font-title-sm text-title-sm text-primary font-bold">
                    {moratoriumText} (छह महीने की छूट)
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    No principal installment is deducted during the initial setup period. Your first
                    regular EMI begins only after the approved venture grace window.
                  </p>
                </div>
              </div>
            </div>

            {/* Input Card 3: Interest Rate Slider & Subsidized Ceiling */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-title-md text-title-md text-primary font-bold">
                      3. Concessional Interest Rate (ब्याज दर)
                    </span>
                    <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                      {hasScheme ? 'Subsidized' : 'Standard Range'}
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {hasScheme
                      ? `Scheme bounded rate: ${schemeMinRate}% – ${schemeMaxRate}% p.a.`
                      : 'Standard 6.5% – 15.0% benchmark range for MSME and personal credit'}
                  </span>
                </div>
                <div className="flex items-center bg-surface-container-high px-3 py-1.5 rounded-lg">
                  <span className="font-title-lg text-title-lg text-primary font-bold">
                    {interestRate.toFixed(2)}%
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">
                    p.a.
                  </span>
                </div>
              </div>

              {/* Rate Slider */}
              <div className="flex flex-col gap-1.5 pt-1">
                <input
                  className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                  id="rateRange"
                  max={schemeMaxRate}
                  min={schemeMinRate}
                  step="0.25"
                  type="range"
                  value={interestRate}
                  onChange={handleRateSliderChange}
                />
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                  <span>{schemeMinRate.toFixed(1)}% (Lower Bound)</span>
                  <span className="font-bold text-primary">
                    {interestRate.toFixed(2)}% (Selected)
                  </span>
                  <span>{schemeMaxRate.toFixed(1)}% (Upper Bound)</span>
                </div>
              </div>

              {/* Institutional Cap Notice */}
              <div className="flex items-center justify-between bg-primary/5 p-space-sm rounded-lg text-primary">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">shield</span>
                  <span className="font-label-sm text-label-sm font-bold">
                    Statutory Rate Protection: Beneficiary rate calibrated to official MoSJE matrix.
                  </span>
                </div>
                <span className="font-label-sm text-label-sm underline cursor-pointer transition-all duration-200 hover:text-secondary">
                  View Directive #442
                </span>
              </div>
            </div>

            {/* Financial Literacy Quick Guide / Micro Graphic */}
            <div className="bg-surface-container p-space-md rounded-xl flex items-center justify-between gap-space-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                  <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-primary font-bold">
                    No Compounding Penalties
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Simple declining balance amortization ensures stable, non-escalating monthly
                    outflows.
                  </span>
                </div>
              </div>
              <button
                className="font-label-sm text-label-sm text-primary font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer transition-all duration-200"
                onClick={() => alert('Frequently Asked Questions on Concessional EMI and Subsidies')}
                type="button"
              >
                Financial FAQ <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Calculation Breakdown, Visual Graphs & Action Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            {/* Primary Result Hero Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col">
              {/* Card Header: Institutional Navy */}
              <div className="bg-primary text-on-primary px-space-lg py-space-md flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed-dim">
                    Calculated Repayment Metric
                  </span>
                  <span className="font-title-sm text-title-sm font-bold">
                    Estimated Monthly EMI (मासिक किस्त)
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary-fixed">
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                </div>
              </div>

              {/* Big Metric Callout */}
              <div className="p-space-lg flex flex-col gap-space-md">
                <div className="flex items-baseline gap-2">
                  <span className="font-display-lg text-display-lg text-primary font-bold leading-none tracking-tight">
                    {formatRupees(summary.monthlyEMI)}
                  </span>
                  <span className="font-title-sm text-title-sm text-on-surface-variant font-bold">
                    / month
                  </span>
                </div>

                {/* Financial Relief Comparison Pill */}
                <div className="bg-surface-container p-space-sm rounded-xl flex flex-col gap-1">
                  <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Standard Commercial Bank EMI (12.5%):</span>
                    <span className="line-through font-bold text-outline">
                      {formatRupees(commercialEMI)} / mo
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary font-title-sm text-title-sm font-bold">
                    <span className="material-symbols-outlined text-lg">savings</span>
                    <span>
                      You save ~{formatRupees(interestSaved)} in total interest under this scheme!
                    </span>
                  </div>
                </div>

                {/* Progress / Proportion Stacked Bar */}
                <div className="flex flex-col gap-1.5 pt-space-xs">
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-bold">
                    <span className="text-primary flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Principal:{' '}
                      <span>{summary.principalRatio}%</span>
                    </span>
                    <span className="text-secondary flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" /> Subsidized
                      Interest: <span>{summary.interestRatio}%</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${summary.principalRatio}%` }}
                    />
                    <div
                      className="h-full bg-secondary-container transition-all duration-300"
                      style={{ width: `${summary.interestRatio}%` }}
                    />
                  </div>
                </div>

                {/* Summary Metric Rows */}
                <div className="flex flex-col gap-2 pt-space-xs">
                  <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-space-sm rounded-lg">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Principal Sanctioned (मूलधन):
                    </span>
                    <span className="font-title-sm text-title-sm text-primary font-bold">
                      {formatRupees(summary.principal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-space-sm rounded-lg">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Total Subsidized Interest (कुल ब्याज):
                    </span>
                    <span className="font-title-sm text-title-sm text-secondary font-bold">
                      {formatRupees(summary.totalInterest)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 bg-surface-container-high px-space-sm rounded-lg">
                    <span className="font-title-sm text-title-sm text-primary font-bold">
                      Total Payable Over Tenure (कुल देय राशि):
                    </span>
                    <span className="font-title-md text-title-md text-primary font-bold">
                      {formatRupees(summary.totalPayable)}
                    </span>
                  </div>
                </div>

                {/* Micro Visual Amortization Breakdown */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                      Annual Repayment Schedule Preview
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary font-bold">
                      No Balloon Dues
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                    {summary.yearlySchedule.map((item) => (
                      <div
                        key={item.year}
                        className="bg-surface-container p-2 rounded-lg flex flex-col"
                      >
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Year {item.year}
                        </span>
                        <span className="font-title-sm text-title-sm text-primary font-bold">
                          {formatRupees(item.amount)}
                        </span>
                        <span
                          className={`font-label-sm text-[10px] ${
                            item.isFinal ? 'text-secondary font-bold' : 'text-tertiary'
                          }`}
                        >
                          {item.isFinal ? 'Final Maturity' : `${item.months} Payments`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* In-Card Assurance Footer */}
              <div className="px-space-lg py-space-sm bg-surface-container-low flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-base text-tertiary">check_circle</span>
                <span className="font-label-sm text-label-sm">
                  Calculation uses reducing balance methodology with MoSJE interest subsidy waiver.
                </span>
              </div>
            </div>

            {/* Action Strip Card */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">near_me</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-primary font-bold">
                    Ready to Move Forward? (आगे बढ़ें)
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Apply with these pre-filled parameters at your nearest partner branch.
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-space-sm pt-1">
                <button
                  className="flex-1 flex items-center justify-center gap-2 bg-secondary-container text-on-primary font-title-sm text-title-sm py-3 px-space-md rounded-lg shadow-sm hover:brightness-110 transition-all duration-200 text-center cursor-pointer"
                  onClick={handleFindPartner}
                  type="button"
                >
                  <span className="material-symbols-outlined">storefront</span>
                  <span>Find Partner Near Me</span>
                </button>
                <button
                  className="flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest text-primary font-title-sm text-title-sm py-3 px-space-md rounded-lg transition-all duration-200 cursor-pointer"
                  onClick={handleDownloadPDF}
                  type="button"
                >
                  <span className="material-symbols-outlined">download</span>
                  <span>Repayment PDF</span>
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 text-outline font-label-sm text-label-sm pt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">article</span> Aadhaar E-Sign
                  Ready
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">history_edu</span> Zero
                  Pre-closure Penalty
                </span>
              </div>
            </div>

            {/* Government Helplines & Branch Desk Support */}
            <div className="bg-surface-container-low p-space-md rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary">headset_mic</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-bold text-primary">
                    Need Clarification on Subsidy Calculation?
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Toll-free advisory: 1800-11-7788 (Dial 2 for Loan Desk)
                  </span>
                </div>
              </div>
              <a
                className="font-label-sm text-label-sm text-secondary font-bold hover:underline transition-all duration-200"
                href="tel:1800117788"
              >
                Request Callback
              </a>
            </div>
          </div>
        </div>

        {/* Educational Section: Real Beneficiary Transparency */}
        <div className="mt-space-xl bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
              Fair Credit Commitment
            </span>
            <h2 className="font-title-lg text-title-lg text-primary font-bold">
              How Does MoSJE Interest Subvention Protect Your Livelihood?
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Commercial moneylenders and non-institutional financiers often levy flat rates
              exceeding 24% to 36% p.a. Under the National Scheduled Castes &amp; Backward Classes
              Finance Development Corporations (NSFDC / NBCFDC), the Central Government bridges the
              interest deficit directly to channel banks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-xs">
            <div className="p-space-md bg-surface-container rounded-xl flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary font-bold mb-1">
                <span className="material-symbols-outlined text-tertiary">check_circle</span>
                <span className="font-title-sm text-title-sm">Simple Declining Balance</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Interest is calculated exclusively on the outstanding principal balance, never on
                the original sanction amount. Every timely payment directly diminishes future
                interest dues.
              </p>
            </div>
            <div className="p-space-md bg-surface-container rounded-xl flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary font-bold mb-1">
                <span className="material-symbols-outlined text-tertiary">check_circle</span>
                <span className="font-title-sm text-title-sm">Zero Foreclosure Penalties</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Beneficiaries are empowered to settle loans ahead of schedule or make lump-sum
                payments during bumper cycles without any punitive charges.
              </p>
            </div>
            <div className="p-space-md bg-surface-container rounded-xl flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary font-bold mb-1">
                <span className="material-symbols-outlined text-tertiary">check_circle</span>
                <span className="font-title-sm text-title-sm">Quarterly Moratorium Audit</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                In cases of documented localized climate disturbances or raw-material market delays,
                extension officers can recommend extending the principal grace period by up to 90
                days.
              </p>
            </div>
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
