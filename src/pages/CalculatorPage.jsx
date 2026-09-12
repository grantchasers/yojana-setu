import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { calculateEMI, buildAmortizationSummary, formatRupees } from '../lib/emiCalculator'
import { SCHEMES } from '../lib/recommendationEngine'
import IndustrialCard from '../components/ui/IndustrialCard'
import TactileButton from '../components/ui/TactileButton'
import LedIndicator from '../components/ui/LedIndicator'
import HardwareBezel from '../components/ui/HardwareBezel'
import SchemePicker from '../components/ui/SchemePicker'
import {
  ShieldCheck,
  Download,
  Store,
  Clock,
  TrendingDown,
  Calendar,
  CheckCircle2,
} from 'lucide-react'

export default function CalculatorPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // Read state if passed from recommendation result or other pages
  const passedState = location.state || {}
  const passedScheme =
    passedState.scheme ||
    (passedState.schemeId ? SCHEMES[passedState.schemeId] : null)

  const [activeSchemeId, setActiveSchemeId] = useState(
    () => passedScheme?.id || passedState.schemeId || 'term_loan'
  )
  const activeScheme = SCHEMES[activeSchemeId] || passedScheme || SCHEMES.term_loan
  const hasScheme = Boolean(activeScheme)

  const schemeMinAmount = hasScheme ? activeScheme.min_amount || 20000 : 10000
  const schemeMaxAmount = hasScheme
    ? activeScheme.max_amount || activeScheme.maxAmount || 500000
    : 2500000

  const rateBounds = {
    education_loan: [3.5, 4.0],
    micro_finance: [4.0, 5.0],
    term_loan: [4.0, 6.0],
  }
  const [schemeMinRate, schemeMaxRate] = hasScheme
    ? [
        activeScheme.interest_rate_min ?? rateBounds[activeSchemeId]?.[0] ?? 4.0,
        activeScheme.interest_rate_max ?? rateBounds[activeSchemeId]?.[1] ?? 6.0,
      ]
    : [6.5, 15.0]

  const schemeName = hasScheme
    ? activeScheme.title || activeScheme.name || 'NSFDC Term Loan Scheme (Micro Enterprise)'
    : 'General Subsidized Credit Window'

  const moratoriumText = hasScheme
    ? activeScheme.moratorium ||
      (activeSchemeId === 'education_loan'
        ? 'Course duration + 1 Year moratorium'
        : activeSchemeId === 'micro_finance'
          ? '3–6 Month Setup Moratorium'
          : '6-Month Setup Moratorium Included')
    : 'Standard Moratorium Grace Window'

  // 2. Local input state
  const [loanAmount, setLoanAmount] = useState(() => {
    const raw = passedState.suggestedAmount ?? (hasScheme ? 135000 : 150000)
    if (hasScheme) {
      return Math.min(schemeMaxAmount, Math.max(schemeMinAmount, raw))
    }
    return raw
  })

  const [tenureMode, setTenureMode] = useState('years')
  const [tenureMonths, setTenureMonths] = useState(36)

  const [interestRate, setInterestRate] = useState(() => {
    if (hasScheme) {
      return 5.0 >= schemeMinRate && 5.0 <= schemeMaxRate
        ? 5.0
        : (schemeMinRate + schemeMaxRate) / 2
    }
    return 8.5
  })

  const [prevSchemeId, setPrevSchemeId] = useState(activeSchemeId)
  if (prevSchemeId !== activeSchemeId) {
    setPrevSchemeId(activeSchemeId)
    setLoanAmount((prev) => Math.min(schemeMaxAmount, Math.max(schemeMinAmount, prev || schemeMinAmount)))
    setInterestRate((prev) => {
      if (prev >= schemeMinRate && prev <= schemeMaxRate) return prev
      return (schemeMinRate + schemeMaxRate) / 2
    })
  }

  // 3. Live calculations using emiCalculator.js
  const summary = useMemo(() => {
    return buildAmortizationSummary({
      principal: loanAmount,
      annualRatePct: interestRate,
      tenureMonths,
    })
  }, [loanAmount, interestRate, tenureMonths])

  // Benchmark commercial bank comparison
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
      if (val > schemeMaxAmount) {
        setLoanAmount(schemeMaxAmount)
      } else {
        setLoanAmount(val)
      }
    } else {
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
        schemeType: activeScheme?.id || 'term_loan',
        schemeName,
      },
    })
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 flex flex-col w-full gap-6 text-left">
      {/* Informational Banner / Hardware Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-panel p-3.5 rounded-xl shadow-recessed border border-white/60">
        <div className="flex items-center gap-3">
          <LedIndicator color="green" size="sm" />
          <span className="font-mono text-xs text-ink font-bold uppercase tracking-wider">
            Official Statutory Rate Matrix // Cycle 2024-25 • MoSJE Direct Lending Standard
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-ink-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Zero Hidden Processing Surcharges
          </span>
          <span className="font-mono text-[10px] bg-chassis px-2.5 py-0.5 rounded shadow-sm text-accent font-bold uppercase tracking-wider">
            NSFDC Audited
          </span>
        </div>
      </div>

      {/* Page Header Hierarchy */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-chassis border border-white/60 shadow-sm text-ink font-mono text-[10px] font-bold rounded uppercase tracking-wider">
              INSTRUMENT PANEL // 02
            </span>
            <span className="text-industrial-border-dark">•</span>
            <span className="font-mono text-xs text-accent font-bold uppercase tracking-wide">
              MoSJE Concessional Window
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight uppercase embossed-text">
            Subsidized Loan EMI Calculator / रियायती ऋण ईएमआई
          </h1>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Active Parameters for:{' '}
            <strong className="text-ink">{schemeName}</strong>. Adjust controls below to simulate cashflow and verify sovereign subsidy benefits.
          </p>
        </div>

        {/* Micro Persona Badge */}
        <div className="flex items-center gap-3 bg-chassis p-3 rounded-xl shadow-card border border-white/60 self-start lg:self-auto">
          <img
            alt="Beneficiary Benchmark"
            className="w-10 h-10 rounded-lg object-cover shadow-recessed border border-white"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKpdxfdf4dK9DrTpTjdocJiursW4_FFqt2BDXUrAI2mZG35w16htuD6E0BgFtb3UfoT5qbPQWP2vQzs8elbYcmp4Ek9Lb7D0J-ugBOi6JYZ3sEzWDAlVOsMtpuIc795BayrOOWCi5-hnuJ4GMjGmZr6OHq_6hEfvZ3mMapTJT5HdvqBS2FA08bHn_eayD7yJVwvLtqFLLY1bljGpyjRCkSmh_3fvxw_HeoFqJ78JMZOsdqj_gLcbgp"
          />
          <div className="flex flex-col text-left font-mono">
            <span className="text-[10px] text-ink-muted uppercase">Benchmark</span>
            <span className="text-xs text-ink font-bold">Village Micro-Units</span>
            <span className="text-[10px] text-emerald-600 font-bold">Concessional Relief Active</span>
          </div>
        </div>
      </div>

      <IndustrialCard className="p-5" cornerScrews>
        <SchemePicker
          schemes={Object.values(SCHEMES)}
          selectedId={activeSchemeId}
          recommendedId={passedScheme?.id || passedState.schemeId}
          onSelect={(id) => setActiveSchemeId(id)}
        />
      </IndustrialCard>

      {/* Main Workspace: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Sliders (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Control Module 1: Loan Amount */}
          <IndustrialCard className="p-6 flex flex-col gap-4" cornerScrews ventSlots>
            <div className="flex items-center justify-between">
              <label className="flex flex-col" htmlFor="loanInput">
                <span className="font-bold text-sm text-ink uppercase tracking-wide">
                  1. Loan Amount (ऋण राशि)
                </span>
                <span className="font-mono text-[11px] text-ink-muted">
                  {hasScheme
                    ? `Limits: ${formatRupees(schemeMinAmount)} – ${formatRupees(schemeMaxAmount)}`
                    : 'Sanction limit (Free entry)'}
                </span>
              </label>
              <div className="flex items-center rounded-lg bg-chassis shadow-recessed px-3 py-1.5 border border-white/40">
                <span className="font-mono text-sm font-bold text-ink mr-1">₹</span>
                <input
                  className="w-32 bg-transparent font-mono text-sm font-bold text-ink text-right outline-none"
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

            {/* Slider with Tactile Style */}
            <div className="flex flex-col gap-2 pt-1">
              <input
                className="w-full h-2.5 bg-panel shadow-recessed rounded-lg appearance-none cursor-pointer accent-accent"
                id="loanRange"
                max={hasScheme ? schemeMaxAmount : 2500000}
                min={hasScheme ? schemeMinAmount : 10000}
                step="5000"
                type="range"
                value={loanAmount || 0}
                onChange={handleLoanSliderChange}
              />
              <div className="flex justify-between font-mono text-[10px] text-ink-muted">
                <span>Min: {formatRupees(hasScheme ? schemeMinAmount : 10000)}</span>
                <span className="text-accent font-bold">Selected: {formatRupees(loanAmount)}</span>
                <span>Max: {formatRupees(hasScheme ? schemeMaxAmount : 2500000)}</span>
              </div>
            </div>

            {/* Preset Keys */}
            <div className="flex flex-wrap gap-2 items-center pt-1">
              <span className="font-mono text-[10px] text-ink-muted uppercase font-bold mr-1">Presets:</span>
              {presets.map((preset) => {
                const isSelected = loanAmount === preset.value
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setLoanAmount(preset.value)}
                    className={`px-3 py-1 font-mono text-xs font-bold rounded-md transition-all duration-150 ${
                      isSelected
                        ? 'bg-chassis text-accent shadow-pressed translate-y-[1px]'
                        : 'bg-chassis text-ink shadow-card hover:shadow-floating active:shadow-pressed active:translate-y-[1px]'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </IndustrialCard>

          {/* Control Module 2: Loan Tenure */}
          <IndustrialCard className="p-6 flex flex-col gap-4" cornerScrews ventSlots>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-bold text-sm text-ink uppercase tracking-wide">
                  2. Loan Tenure (ऋण अवधि)
                </span>
                <span className="font-mono text-[11px] text-ink-muted">Scheduled repayment horizon</span>
              </div>
              <div className="inline-flex items-center bg-chassis rounded-lg p-1 shadow-recessed">
                <button
                  type="button"
                  onClick={() => setTenureMode('years')}
                  className={`px-3 py-1 font-mono text-xs font-bold rounded-md transition-all duration-150 ${
                    tenureMode === 'years'
                      ? 'bg-accent text-white shadow-btn-primary translate-y-[1px]'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Years
                </button>
                <button
                  type="button"
                  onClick={() => setTenureMode('months')}
                  className={`px-3 py-1 font-mono text-xs font-bold rounded-md transition-all duration-150 ${
                    tenureMode === 'months'
                      ? 'bg-accent text-white shadow-btn-primary translate-y-[1px]'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Months
                </button>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-extrabold text-ink leading-none">
                  {tenureMode === 'years' ? tenureYears : tenureMonths}
                </span>
                <span className="font-mono text-xs text-ink-muted font-bold uppercase">
                  {tenureMode === 'years'
                    ? `Years (${tenureMonths} Months)`
                    : `Months (${tenureYears} Years)`}
                </span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                Flexible Prepayment
              </span>
            </div>

            {/* Slider for Tenure */}
            <div className="flex flex-col gap-2">
              <input
                className="w-full h-2.5 bg-panel shadow-recessed rounded-lg appearance-none cursor-pointer accent-accent"
                id="tenureRange"
                max={tenureMode === 'years' ? '5' : '60'}
                min={tenureMode === 'years' ? '1' : '6'}
                step={tenureMode === 'years' ? '1' : '6'}
                type="range"
                value={
                  tenureMode === 'years'
                    ? Math.min(5, Math.max(1, Math.round(tenureMonths / 12)))
                    : tenureMonths
                }
                onChange={tenureMode === 'years' ? handleTenureYearsChange : handleTenureMonthsChange}
              />
              <div className="flex justify-between font-mono text-[10px] text-ink-muted">
                <span>{tenureMode === 'years' ? '1 Year' : '6 Mo'}</span>
                <span className="text-accent font-bold">Standard 3 Years</span>
                <span>{tenureMode === 'years' ? '5 Years' : '60 Mo'}</span>
              </div>
            </div>

            {/* Moratorium Feature Callout */}
            <div className="flex items-start gap-3 bg-panel p-3.5 rounded-lg shadow-recessed border border-white/60">
              <Clock className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="flex flex-col font-mono text-xs">
                <span className="font-bold text-ink">{moratoriumText} (छह महीने की छूट)</span>
                <span className="text-[11px] text-ink-muted mt-0.5">
                  No principal installment is deducted during the initial setup period. First regular EMI begins after the grace window.
                </span>
              </div>
            </div>
          </IndustrialCard>

          {/* Control Module 3: Interest Rate Slider */}
          <IndustrialCard className="p-6 flex flex-col gap-4" cornerScrews ventSlots>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-ink uppercase tracking-wide">
                    3. Concessional Interest Rate (ब्याज दर)
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent font-bold uppercase">
                    Subsidized
                  </span>
                </div>
                <span className="font-mono text-[11px] text-ink-muted">
                  Bounded rate: {schemeMinRate}% – {schemeMaxRate}% p.a.
                </span>
              </div>
              <div className="rounded-lg bg-chassis shadow-recessed px-3 py-1.5 border border-white/40 font-mono text-base font-extrabold text-ink">
                {interestRate.toFixed(2)}% <span className="text-xs text-ink-muted font-normal">p.a.</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <input
                className="w-full h-2.5 bg-panel shadow-recessed rounded-lg appearance-none cursor-pointer accent-accent"
                id="rateRange"
                max={schemeMaxRate}
                min={schemeMinRate}
                step="0.25"
                type="range"
                value={interestRate}
                onChange={handleRateSliderChange}
              />
              <div className="flex justify-between font-mono text-[10px] text-ink-muted">
                <span>{schemeMinRate.toFixed(1)}% Floor</span>
                <span className="text-accent font-bold">{interestRate.toFixed(2)}% Active</span>
                <span>{schemeMaxRate.toFixed(1)}% Ceiling</span>
              </div>
            </div>
          </IndustrialCard>
        </div>

        {/* RIGHT COLUMN: CRT Display Readout & Breakdown (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* CRT Screen Bezel: Primary Calculation Hero */}
          <HardwareBezel
            title="TELEMETRY // EMI READOUT"
            statusText="CALIBRATED"
            indicatorColor="green"
            scanlines
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <span className="font-mono text-xs text-white/60 uppercase tracking-widest">
                  Estimated Monthly EMI (मासिक किस्त)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-4xl sm:text-5xl font-extrabold text-accent tracking-tight drop-shadow-[0_0_8px_rgba(255,71,87,0.6)]">
                    {formatRupees(summary.monthlyEMI)}
                  </span>
                  <span className="font-mono text-xs text-white/50 uppercase">/ Month</span>
                </div>
              </div>

              {/* Commercial Comparison Box */}
              <div className="p-3 rounded-lg bg-black/40 border border-white/10 font-mono text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-white/60">
                  <span>Commercial Bank EMI (12.5%):</span>
                  <span className="line-through text-white/40">{formatRupees(commercialEMI)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <TrendingDown className="w-4 h-4" />
                  <span>Saves ~{formatRupees(interestSaved)} in interest relief!</span>
                </div>
              </div>

              {/* Proportion Bar */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex justify-between font-mono text-[11px] text-white/70 font-bold">
                  <span>Principal: {summary.principalRatio}%</span>
                  <span className="text-accent">Subsidized Interest: {summary.interestRatio}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden flex border border-white/10">
                  <div className="h-full bg-white transition-all duration-300" style={{ width: `${summary.principalRatio}%` }} />
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${summary.interestRatio}%` }} />
                </div>
              </div>

              {/* Summary Rows */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10 font-mono text-xs">
                <div className="flex items-center justify-between text-white/70">
                  <span>Principal Sanctioned:</span>
                  <span className="text-white font-bold">{formatRupees(summary.principal)}</span>
                </div>
                <div className="flex items-center justify-between text-white/70">
                  <span>Total Subsidized Interest:</span>
                  <span className="text-accent font-bold">{formatRupees(summary.totalInterest)}</span>
                </div>
                <div className="flex items-center justify-between text-white/90 pt-1 border-t border-white/5 font-bold text-sm">
                  <span>Total Payable:</span>
                  <span className="text-emerald-400">{formatRupees(summary.totalPayable)}</span>
                </div>
              </div>
            </div>
          </HardwareBezel>

          {/* Annual Repayment Schedule Card */}
          <IndustrialCard className="p-6 flex flex-col gap-4" cornerScrews>
            <div className="flex items-center justify-between border-b border-industrial-border-shadow/20 pb-3">
              <span className="font-mono text-xs text-ink uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-accent" /> Annual Repayment Schedule
              </span>
              <span className="font-mono text-[10px] text-emerald-600 font-bold uppercase">No Balloon Dues</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              {summary.yearlySchedule.map((item) => (
                <div key={item.year} className="bg-panel p-2.5 rounded-lg shadow-recessed flex flex-col">
                  <span className="font-mono text-[10px] text-ink-muted uppercase">Year {item.year}</span>
                  <span className="font-mono text-xs font-bold text-ink mt-0.5">{formatRupees(item.amount)}</span>
                  <span className={`font-mono text-[9px] mt-1 ${item.isFinal ? 'text-accent font-bold' : 'text-emerald-600'}`}>
                    {item.isFinal ? 'Maturity' : `${item.months} PMTS`}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <TactileButton variant="primary" size="md" className="flex-1" icon={Store} onClick={handleFindPartner}>
                Find Partner Near Me
              </TactileButton>
              <TactileButton variant="secondary" size="md" icon={Download} onClick={handleDownloadPDF}>
                Repayment PDF
              </TactileButton>
            </div>
          </IndustrialCard>
        </div>
      </div>

      {/* Educational Section: Fair Credit Commitment */}
      <IndustrialCard className="p-6 flex flex-col gap-4" cornerScrews>
        <div className="flex flex-col">
          <span className="font-mono text-xs text-accent font-bold uppercase tracking-wider">
            Fair Credit Commitment
          </span>
          <h2 className="text-base sm:text-lg font-bold text-ink mt-0.5 embossed-text">
            How Does MoSJE Interest Subvention Protect Your Livelihood?
          </h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Under NSFDC & NBCFDC corporations, the Central Government bridges the interest deficit directly to channel banks to ensure small entrepreneurs receive fair capital access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-lg bg-panel shadow-recessed flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-ink font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Simple Declining Balance</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Interest is calculated exclusively on outstanding principal, never on original sanction amount.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-panel shadow-recessed flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-ink font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero Foreclosure Penalties</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Beneficiaries are empowered to settle loans ahead of schedule without any punitive charges.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-panel shadow-recessed flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-ink font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Quarterly Moratorium Audit</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Extension officers can recommend extending principal grace by up to 90 days for documented delays.
            </p>
          </div>
        </div>
      </IndustrialCard>

      {/* Mechanical Footer */}
      <footer className="w-full rounded-xl bg-chassis p-4 shadow-card border border-white/60">
        <div className="flex flex-wrap items-center justify-between text-ink-muted font-mono text-xs gap-3">
          <div>Official portal of the Ministry of Social Justice & Empowerment • Government of India</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" /> Certified Data Privacy
            </span>
            <span>Helpline: 1800-11-7788</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
