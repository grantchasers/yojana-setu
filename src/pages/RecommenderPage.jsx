import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../lib/formatCurrency'
import {
  recommendScheme,
  formatIndianCurrency,
  numberToIndianWords,
  PROJECT_TYPES,
  EDUCATION_STATUSES,
} from '../lib/recommendationEngine'

export default function RecommenderPage() {
  const navigate = useNavigate()

  // 4-step wizard local state
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState({
    projectType: 'Small trade/business',
    projectCost: '1,50,000',
    monthlyFamilyIncome: '25,000',
    educationStatus: '12th Pass',
  })

  // Voice assistance feedback simulation state
  const [isListening, setIsListening] = useState(false)
  const [saveToast, setSaveToast] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Numerical conversions
  const numericCost = useMemo(() => {
    const clean = String(answers.projectCost || '').replace(/[^0-9]/g, '')
    return clean ? parseInt(clean, 10) : 0
  }, [answers.projectCost])

  const numericMonthlyIncome = useMemo(() => {
    const clean = String(answers.monthlyFamilyIncome || '').replace(/[^0-9]/g, '')
    return clean ? parseInt(clean, 10) : 0
  }, [answers.monthlyFamilyIncome])

  const annualIncome = numericMonthlyIncome * 12
  const isIncomeOverCeiling = annualIncome > 500000

  // Real-time scheme match peek
  const liveRecommendation = useMemo(() => {
    return recommendScheme({
      projectType: answers.projectType,
      projectCost: numericCost,
      monthlyFamilyIncome: numericMonthlyIncome,
      educationStatus: answers.educationStatus,
    })
  }, [answers.projectType, numericCost, numericMonthlyIncome, answers.educationStatus])

  // Step definitions
  const steps = [
    { number: 1, key: 'projectType', title: '1. Project Type', name: 'Project Type' },
    { number: 2, key: 'projectCost', title: '2. Project Cost', name: 'Project Cost' },
    { number: 3, key: 'monthlyFamilyIncome', title: '3. Family Income', name: 'Family Income' },
    { number: 4, key: 'educationStatus', title: '4. Qualifications', name: 'Qualifications' },
  ]

  // Step validity checking
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return Boolean(answers.projectType)
      case 2:
        return numericCost > 0
      case 3:
        return numericMonthlyIncome > 0
      case 4:
        return numericCost > 0 && numericMonthlyIncome > 0 && Boolean(answers.educationStatus)
      default:
        return true
    }
  }, [currentStep, answers.projectType, numericCost, numericMonthlyIncome, answers.educationStatus])

  // Helper text explaining what's missing when button is disabled
  const getStepMissingMessage = () => {
    switch (currentStep) {
      case 1:
        return 'Please select a project type to continue / कृपया प्रोजेक्ट प्रकार चुनें'
      case 2:
        return 'Project cost must be a positive number greater than ₹0 / परियोजना लागत ₹0 से अधिक होनी चाहिए'
      case 3:
        return 'Monthly family income must be a positive number greater than ₹0 / मासिक आय ₹0 से अधिक होनी चाहिए'
      case 4:
        if (numericCost <= 0 && numericMonthlyIncome <= 0) {
          return 'Project cost and monthly family income must be positive numbers / लागत और आय दोनों ₹0 से अधिक होने चाहिए'
        }
        if (numericCost <= 0) {
          return 'Project cost must be greater than ₹0 (Return to Step 2 to edit) / परियोजना लागत ₹0 से अधिक होनी चाहिए'
        }
        if (numericMonthlyIncome <= 0) {
          return 'Monthly family income must be greater than ₹0 (Return to Step 3 to edit) / मासिक आय ₹0 से अधिक होनी चाहिए'
        }
        if (!answers.educationStatus) {
          return 'Please select your educational qualification / कृपया शैक्षणिक योग्यता चुनें'
        }
        return null
      default:
        return null
    }
  }

  // Handlers
  const handleCostChange = (e) => {
    const formatted = formatIndianCurrency(e.target.value)
    setAnswers((prev) => ({ ...prev, projectCost: formatted }))
  }

  const handleIncomeChange = (e) => {
    const formatted = formatIndianCurrency(e.target.value)
    setAnswers((prev) => ({ ...prev, monthlyFamilyIncome: formatted }))
  }

  const handlePresetCost = (amount) => {
    setAnswers((prev) => ({ ...prev, projectCost: formatIndianCurrency(amount) }))
  }

  const handlePresetIncome = (amount) => {
    setAnswers((prev) => ({ ...prev, monthlyFamilyIncome: formatIndianCurrency(amount) }))
  }

  const handleNext = async () => {
    if (currentStep < 4) {
      if (!isStepValid) return
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      if (!isStepValid || isSubmitting) return
      // Final step: Compute recommendation with an async loading state
      setIsSubmitting(true)
      await new Promise((resolve) => setTimeout(resolve, 600))

      const result = recommendScheme({
        projectType: answers.projectType,
        projectCost: numericCost,
        monthlyFamilyIncome: numericMonthlyIncome,
        educationStatus: answers.educationStatus,
      })

      navigate('/recommender/result', {
        state: {
          result,
          answers: {
            projectType: answers.projectType,
            projectCost: numericCost,
            monthlyFamilyIncome: numericMonthlyIncome,
            educationStatus: answers.educationStatus,
            projectCostFormatted: answers.projectCost,
            monthlyFamilyIncomeFormatted: answers.monthlyFamilyIncome,
            annualFamilyIncome: annualIncome,
          },
        },
      })
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1 && !isSubmitting) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSaveProgress = async () => {
    if (isSaving || isSubmitting) return
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      localStorage.setItem(
        'yojana_draft_recommender',
        JSON.stringify({ answers, currentStep, savedAt: new Date().toISOString() })
      )
    } catch {
      // ignore storage quota issues
    }
    setIsSaving(false)
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 2500)
  }

  return (
    <div className="px-gutter-lg py-space-lg flex flex-col w-full min-h-[calc(100vh-4rem)] justify-between">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-space-lg">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm uppercase tracking-wider">
                Standard Eligibility Pathway
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-label-sm text-label-sm text-secondary font-bold">
                NSFDC &amp; NBCFDC Calibrated
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              Scheme Eligibility Matcher{' '}
              <span className="text-outline font-title-md">| अपनी पात्रता के अनुसार योजना खोजें</span>
            </h1>
          </div>

          <div className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-xs rounded-xl shadow-sm self-start md:self-auto">
            <span className="material-symbols-outlined text-secondary text-xl">tune</span>
            <div className="flex flex-col text-left">
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                Evaluation Step
              </span>
              <span className="font-title-sm text-title-sm text-primary font-bold">
                Step {currentStep} of 4 : {steps[currentStep - 1].name}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Indicator Rail */}
        <div className="w-full bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step) => {
              const isCompleted = step.number < currentStep
              const isActive = step.number === currentStep
              const isUpcoming = step.number > currentStep

              return (
                <div
                  key={step.number}
                  className={`flex flex-col gap-1.5 transition-opacity ${
                    isUpcoming ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <div
                    className={`h-2 w-full rounded-full transition-colors ${
                      isCompleted
                        ? 'bg-tertiary'
                        : isActive
                          ? 'bg-secondary-container'
                          : 'bg-surface-container-highest'
                    }`}
                  />
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <span
                        className="material-symbols-outlined text-tertiary text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    ) : isActive ? (
                      <span className="w-4 h-4 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-[10px] font-bold">
                        {step.number}
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-sm text-[10px]">
                        {step.number}
                      </span>
                    )}
                    <span
                      className={`font-label-sm text-label-sm truncate ${
                        isCompleted
                          ? 'text-on-surface font-semibold'
                          : isActive
                            ? 'text-secondary font-bold'
                            : 'text-on-surface-variant'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Active Step Focus Card */}
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-gutter-lg flex flex-col gap-space-lg relative overflow-hidden text-left">
          {/* Sector Snapshot Banner (Visible when beyond step 1) */}
          {currentStep > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">
                    {PROJECT_TYPES.find((p) => p.id === answers.projectType)?.icon || 'storefront'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                    Sector chosen in Step 1
                  </span>
                  <span className="font-title-sm text-title-sm text-primary font-bold">
                    {answers.projectType} (
                    {PROJECT_TYPES.find((p) => p.id === answers.projectType)?.labelHi || ''})
                  </span>
                </div>
              </div>
              <button
                className="px-space-sm py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-label-sm transition-all duration-200 flex items-center gap-1 cursor-pointer"
                onClick={() => setCurrentStep(1)}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Change
              </button>
            </div>
          )}

          {/* ================= STEP 1: PROJECT TYPE ================= */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-space-md">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
                  What type of project or venture are you planning?
                  <span className="block font-title-lg text-title-lg text-on-surface-variant font-normal mt-0.5">
                    आप किस प्रकार के प्रोजेक्ट या व्यवसाय की योजना बना रहे हैं?
                  </span>
                </h2>
                <button
                  className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 shadow-sm cursor-pointer ${
                    isListening
                      ? 'bg-error text-on-error animate-pulse'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-primary'
                  }`}
                  onClick={() => setIsListening(!isListening)}
                  title="Tap to dictate in Hindi or English"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">
                    {isListening ? 'mic_off' : 'mic'}
                  </span>
                  <span className="font-label-sm text-[10px] leading-none font-bold">
                    {isListening ? 'Stop' : 'Speak'}
                  </span>
                </button>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Select the primary sector that describes your economic initiative or educational
                aspiration. Concessional welfare credit is channeled according to approved MoSJE
                activity codes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-2">
                {PROJECT_TYPES.map((item) => {
                  const isSelected = answers.projectType === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, projectType: item.id }))}
                      className={`p-space-md rounded-xl text-left transition-all duration-200 flex flex-col justify-between min-h-[110px] cursor-pointer border ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary shadow-md ring-2 ring-primary/20'
                          : 'bg-surface-container hover:bg-surface-container-high text-primary border-transparent shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                          <span className="font-title-md text-title-md font-bold leading-tight">
                            {item.label}
                          </span>
                        </div>
                        {isSelected && (
                          <span
                            className="material-symbols-outlined text-secondary-fixed text-lg"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        )}
                      </div>
                      <span
                        className={`font-label-sm text-label-sm ${
                          isSelected ? 'text-secondary-fixed' : 'text-secondary'
                        } font-semibold`}
                      >
                        {item.labelHi}
                      </span>
                      <p
                        className={`font-body-sm text-body-sm mt-1 line-clamp-2 ${
                          isSelected ? 'text-surface-container-highest' : 'text-on-surface-variant'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 2: PROJECT COST ================= */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-space-md">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
                  What is your estimated total project cost?
                  <span className="block font-title-lg text-title-lg text-on-surface-variant font-normal mt-0.5">
                    आपके प्रोजेक्ट की अनुमानित कुल लागत कितनी है?
                  </span>
                </h2>
                <button
                  className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 shadow-sm cursor-pointer ${
                    isListening
                      ? 'bg-error text-on-error animate-pulse'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-primary'
                  }`}
                  onClick={() => setIsListening(!isListening)}
                  title="Tap to dictate amount in Hindi or English"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">
                    {isListening ? 'mic_off' : 'mic'}
                  </span>
                  <span className="font-label-sm text-[10px] leading-none font-bold">
                    {isListening ? 'Stop' : 'Speak'}
                  </span>
                </button>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Include machinery, furniture, raw inventory, and initial operational funds. You do
                not need exact quotations — an approximate working capital budget is sufficient.
              </p>

              {/* Financial Input Block */}
              <div className="flex flex-col gap-space-md pt-1">
                <div className="flex flex-col">
                  <label
                    className="font-label-lg text-label-lg text-primary font-bold mb-2 flex items-center justify-between"
                    htmlFor="projectCostInput"
                  >
                    <span>Capital Requirement (परियोजना लागत)</span>
                    <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-sm">verified</span> Verified range
                      up to {formatCurrency(1500000)}
                    </span>
                  </label>
                  <div
                    className={`relative flex items-stretch h-16 w-full rounded-xl bg-surface-container-low shadow-inner overflow-hidden focus-within:ring-2 focus-within:ring-primary-container transition-all border ${
                      numericCost <= 0
                        ? 'border-error/60 ring-1 ring-error/30'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="bg-surface-container px-space-md flex items-center justify-center text-primary font-headline-md text-headline-md font-bold select-none">
                      ₹
                    </div>
                    <input
                      aria-label="Estimated project cost in Indian Rupees"
                      className="w-full bg-transparent px-space-md font-display-lg text-display-lg text-primary font-bold tracking-tight focus:outline-none"
                      id="projectCostInput"
                      placeholder="0"
                      type="text"
                      value={answers.projectCost}
                      onChange={handleCostChange}
                    />
                    <div className="px-space-md flex items-center text-on-surface-variant font-title-sm text-title-sm">
                      INR
                    </div>
                  </div>
                  {numericCost <= 0 ? (
                    <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-1.5 pl-1">
                      <span className="material-symbols-outlined text-sm shrink-0">error</span>
                      <span>
                        Project cost must be a positive number greater than ₹0 (परियोजना लागत ₹0 से अधिक होनी चाहिए)
                      </span>
                    </p>
                  ) : (
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-1.5 pl-1">
                      Amount in words:{' '}
                      <strong className="text-primary">{numberToIndianWords(numericCost)}</strong>
                    </span>
                  )}
                </div>

                {/* Quick Select Preset Chips */}
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Common Benchmark Presets / मानक विकल्प
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
                    {[
                      { amount: 50000, label: '₹50,000', sub: 'Micro Venture (सूक्ष्म उद्यम)' },
                      { amount: 150000, label: '₹1.5 Lakh', sub: 'Service / Retail (दुकान / सेवा)' },
                      { amount: 300000, label: '₹3.0 Lakh', sub: 'Small Workshop (कार्यशाला)' },
                      { amount: 500000, label: '₹5.0 Lakh', sub: 'Processing / Dairy (डेयरी)' },
                    ].map((preset) => {
                      const isSelected = numericCost === preset.amount
                      return (
                        <button
                          key={preset.amount}
                          className={`text-left p-space-sm rounded-xl transition-all duration-200 flex flex-col justify-between h-20 shadow-sm cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container hover:bg-surface-container-high text-primary'
                          }`}
                          onClick={() => handlePresetCost(preset.amount)}
                          type="button"
                        >
                          <span className="font-title-md text-title-md font-bold">
                            {preset.label}
                          </span>
                          <span
                            className={`font-label-sm text-label-sm leading-tight ${
                              isSelected ? 'text-primary-fixed-dim' : 'text-on-surface-variant'
                            }`}
                          >
                            {preset.sub}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: MONTHLY FAMILY INCOME ================= */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-space-md">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
                  What is your monthly family income?
                  <span className="block font-title-lg text-title-lg text-on-surface-variant font-normal mt-0.5">
                    आपकी मासिक पारिवारिक आय कितनी है?
                  </span>
                </h2>
                <button
                  className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 shadow-sm cursor-pointer ${
                    isListening
                      ? 'bg-error text-on-error animate-pulse'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-primary'
                  }`}
                  onClick={() => setIsListening(!isListening)}
                  title="Tap to dictate monthly income"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xl">
                    {isListening ? 'mic_off' : 'mic'}
                  </span>
                  <span className="font-label-sm text-[10px] leading-none font-bold">
                    {isListening ? 'Stop' : 'Speak'}
                  </span>
                </button>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Combine the gross earnings of all earning members of the household. MoSJE concessional
                schemes feature an annual family income ceiling of {formatCurrency(500000)} for maximum subsidy
                benefit.
              </p>

              {/* Income Input Block */}
              <div className="flex flex-col gap-space-md pt-1">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="font-label-lg text-label-lg text-primary font-bold"
                      htmlFor="incomeInput"
                    >
                      Monthly Household Income (मासिक आय)
                    </label>
                    <span
                      className={`font-label-sm text-label-sm flex items-center gap-1 font-semibold ${
                        isIncomeOverCeiling ? 'text-error' : 'text-tertiary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isIncomeOverCeiling ? 'warning' : 'verified'}
                      </span>
                      {isIncomeOverCeiling
                        ? 'Exceeds ₹5 Lakh/yr ceiling'
                        : 'Eligible: under ₹5 Lakh/yr ceiling'}
                    </span>
                  </div>

                  <div
                    className={`relative flex items-stretch h-16 w-full rounded-xl bg-surface-container-low shadow-inner overflow-hidden focus-within:ring-2 focus-within:ring-primary-container transition-all border ${
                      numericMonthlyIncome <= 0
                        ? 'border-error/60 ring-1 ring-error/30'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="bg-surface-container px-space-md flex items-center justify-center text-primary font-headline-md text-headline-md font-bold select-none">
                      ₹
                    </div>
                    <input
                      aria-label="Monthly household income in Indian Rupees"
                      className="w-full bg-transparent px-space-md font-display-lg text-display-lg text-primary font-bold tracking-tight focus:outline-none"
                      id="incomeInput"
                      placeholder="0"
                      type="text"
                      value={answers.monthlyFamilyIncome}
                      onChange={handleIncomeChange}
                    />
                    <div className="px-space-md flex items-center text-on-surface-variant font-title-sm text-title-sm">
                      / month
                    </div>
                  </div>

                  {numericMonthlyIncome <= 0 ? (
                    <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-1.5 pl-1">
                      <span className="material-symbols-outlined text-sm shrink-0">error</span>
                      <span>
                        Monthly family income must be a positive number greater than ₹0 (मासिक आय ₹0 से अधिक होनी चाहिए)
                      </span>
                    </p>
                  ) : (
                    /* Computed Annual Income Indicator */
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pl-1">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Computed Annual Income:{' '}
                        <strong className="text-primary">
                          {formatCurrency(annualIncome)} / year
                        </strong>{' '}
                        ({numberToIndianWords(numericMonthlyIncome)} per month)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                          isIncomeOverCeiling
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-tertiary-container text-on-tertiary-container'
                        }`}
                      >
                        {isIncomeOverCeiling
                          ? 'Annual income exceeds ₹5L ceiling'
                          : 'Within Welfare Concessional Ceiling'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Select Presets for Monthly Income */}
                <div className="flex flex-col gap-2">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Common Income Benchmarks / मानक आय स्तर
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
                    {[
                      { amount: 15000, label: '₹15,000', sub: 'Annual: ₹1.80 Lakh' },
                      { amount: 25000, label: '₹25,000', sub: 'Annual: ₹3.00 Lakh' },
                      { amount: 35000, label: '₹35,000', sub: 'Annual: ₹4.20 Lakh' },
                      { amount: 50000, label: '₹50,000', sub: 'Annual: ₹6.00 Lakh (Above ceiling)' },
                    ].map((preset) => {
                      const isSelected = numericMonthlyIncome === preset.amount
                      return (
                        <button
                          key={preset.amount}
                          className={`text-left p-space-sm rounded-xl transition-all duration-200 flex flex-col justify-between h-20 shadow-sm cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container hover:bg-surface-container-high text-primary'
                          }`}
                          onClick={() => handlePresetIncome(preset.amount)}
                          type="button"
                        >
                          <span className="font-title-md text-title-md font-bold">
                            {preset.label}
                          </span>
                          <span
                            className={`font-label-sm text-label-sm leading-tight ${
                              isSelected ? 'text-primary-fixed-dim' : 'text-on-surface-variant'
                            }`}
                          >
                            {preset.sub}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: EDUCATION STATUS ================= */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-space-md">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
                  What is your highest educational qualification?
                  <span className="block font-title-lg text-title-lg text-on-surface-variant font-normal mt-0.5">
                    आपकी उच्चतम शैक्षणिक योग्यता क्या है?
                  </span>
                </h2>
                <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">school</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Qualifications determine eligibility for special skill-subvention programs, technical
                incubation, and higher education loan subventions under MoSJE corporations.
              </p>

              {/* Dropdown Selection */}
              <div className="flex flex-col gap-space-sm pt-2">
                <label
                  className="font-label-lg text-label-lg text-primary font-bold"
                  htmlFor="educationSelect"
                >
                  Select Qualification (शैक्षणिक योग्यता चुनें)
                </label>
                <div className="relative w-full">
                  <select
                    id="educationSelect"
                    value={answers.educationStatus}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, educationStatus: e.target.value }))
                    }
                    className="w-full h-14 pl-space-md pr-10 bg-surface-container-low text-primary font-title-md text-title-md rounded-xl border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer transition-all duration-200"
                  >
                    {EDUCATION_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-2xl">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              {/* Review Summary of All Inputs */}
              <div className="mt-space-sm p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-sm border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <span className="font-title-sm text-title-sm text-primary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-secondary">
                      fact_check
                    </span>
                    Application Input Summary (आवेदक विवरण सारांश)
                  </span>
                  <span className="font-label-sm text-label-sm text-tertiary font-semibold">
                    Ready for Algorithmic Recommendation
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-space-sm pt-1">
                  <div className="p-space-xs bg-surface-container-lowest rounded-lg">
                    <span className="block font-label-sm text-[11px] text-on-surface-variant uppercase">
                      Sector / Activity
                    </span>
                    <span className="font-title-sm text-title-sm text-primary font-bold">
                      {answers.projectType}
                    </span>
                  </div>
                  <div className={`p-space-xs rounded-lg transition-colors ${numericCost <= 0 ? 'bg-error-container/40 border border-error/50' : 'bg-surface-container-lowest'}`}>
                    <span className="block font-label-sm text-[11px] text-on-surface-variant uppercase">
                      Project Cost
                    </span>
                    <span className={`font-title-sm text-title-sm font-bold ${numericCost <= 0 ? 'text-error flex items-center gap-1' : 'text-primary'}`}>
                      {numericCost > 0 ? (
                        formatCurrency(answers.projectCost)
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-xs">error</span>
                          Required (&gt; ₹0)
                        </>
                      )}
                    </span>
                  </div>
                  <div className={`p-space-xs rounded-lg transition-colors ${numericMonthlyIncome <= 0 ? 'bg-error-container/40 border border-error/50' : 'bg-surface-container-lowest'}`}>
                    <span className="block font-label-sm text-[11px] text-on-surface-variant uppercase">
                      Monthly / Annual Income
                    </span>
                    <span className={`font-title-sm text-title-sm font-bold ${numericMonthlyIncome <= 0 ? 'text-error flex items-center gap-1' : 'text-primary'}`}>
                      {numericMonthlyIncome > 0 ? (
                        <>
                          {formatCurrency(answers.monthlyFamilyIncome)}{' '}
                          <span className="text-[11px] font-normal text-on-surface-variant">
                            ({formatCurrency(annualIncome)}/yr)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-xs">error</span>
                          Required (&gt; ₹0)
                        </>
                      )}
                    </span>
                  </div>
                  <div className="p-space-xs bg-surface-container-lowest rounded-lg">
                    <span className="block font-label-sm text-[11px] text-on-surface-variant uppercase">
                      Qualification
                    </span>
                    <span className="font-title-sm text-title-sm text-primary font-bold">
                      {answers.educationStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regulatory Insight Box */}
          <div className="bg-surface-container p-space-md rounded-xl flex items-start gap-space-md shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-secondary shrink-0 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">lightbulb</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-title-sm text-title-sm text-primary font-bold">
                Scheme Threshold Intelligence
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {currentStep === 1 && (
                  <>
                    Beneficiaries in <strong>Small trade</strong>, <strong>Manufacturing</strong>, and{' '}
                    <strong>Higher education</strong> qualify for preferential credit windows under
                    NSFDC (SCs) and NBCFDC (OBCs) corporations.
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    Did you know? Projects up to <strong>{formatCurrency(140000)}</strong> qualify for the{' '}
                    <em>NBCFDC Micro Finance Scheme</em> with an accelerated 7-day single-window
                    verification and zero collateral mortgage requirements.
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    Under statutory MoSJE guidelines, applicant families with annual income up to{' '}
                    <strong>{formatCurrency(500000)}</strong> receive maximum interest subventions down to{' '}
                    <strong>4.0% p.a.</strong> Annual income above {formatCurrency(500000)} falls outside welfare
                    subsidized loan ceilings.
                  </>
                )}
                {currentStep === 4 && (
                  <>
                    Higher technical qualifications and verified matriculation certifications enable
                    fast-track sanctioning under National Corporation State Channelising Agencies
                    (SCAs).
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Live Matched Schemes Dynamic Peek */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-lg">hub</span>
                <span className="font-title-sm text-title-sm text-primary font-bold">
                  Eligible Scheme Cohorts for Current Parameters
                </span>
              </div>
              <span
                className={`font-label-sm text-label-sm px-2 py-0.5 rounded font-semibold ${
                  liveRecommendation.eligible
                    ? 'bg-tertiary-container text-on-tertiary-container'
                    : 'bg-error-container text-on-error-container'
                }`}
              >
                {liveRecommendation.eligible
                  ? 'Active Matching Scheme'
                  : 'Income Ceiling Exceeded'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-1">
              {liveRecommendation.eligible ? (
                <>
                  <div className="p-space-sm rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between border-2 border-primary">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-[11px] text-secondary uppercase font-bold tracking-wide">
                          Recommended Scheme
                        </span>
                        <span className="text-[10px] bg-primary text-on-primary px-1.5 py-0.5 rounded font-bold">
                          TOP MATCH
                        </span>
                      </div>
                      <h4 className="font-title-sm text-title-sm text-primary mt-0.5 leading-snug">
                        {liveRecommendation.schemeName || 'Central Welfare Scheme'}
                      </h4>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-semibold mt-2">
                      Rate: {liveRecommendation.interestRate} • Ratio:{' '}
                      {liveRecommendation.loanRatio}
                    </span>
                  </div>

                  <div className="p-space-sm rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="font-label-sm text-[11px] text-primary-container uppercase font-bold tracking-wide">
                        MoSJE Concession
                      </span>
                      <h4 className="font-title-sm text-title-sm text-primary mt-0.5 leading-snug">
                        PM-DAKSH Credit Linkage
                      </h4>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-semibold mt-2">
                      Up to {formatCurrency(500000)} @ 5% p.a.
                    </span>
                  </div>

                  <div className="p-space-sm rounded-lg bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="font-label-sm text-[11px] text-on-surface-variant uppercase font-bold tracking-wide">
                        NSFDC Direct
                      </span>
                      <h4 className="font-title-sm text-title-sm text-primary mt-0.5 leading-snug">
                        Mahila Samriddhi Yojana
                      </h4>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-semibold mt-2">
                      Special 4% Subvention
                    </span>
                  </div>
                </>
              ) : (
                <div className="col-span-3 p-space-md rounded-lg bg-error-container text-on-error-container">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span className="material-symbols-outlined text-error">warning</span>
                    <span>Annual Family Income Exceeds {formatCurrency(500000)} Welfare Ceiling</span>
                  </div>
                  <p className="font-body-sm text-body-sm">
                    {liveRecommendation.reason}. Concessional MoSJE micro-credit requires family
                    income within {formatCurrency(500000)}. On submission, commercial bank options and alternate
                    support pathways will be displayed.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Navigation Bar */}
          <div className="flex flex-col gap-2 pt-space-md border-t border-outline-variant/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <button
                className={`w-full sm:w-auto h-12 px-space-lg rounded-lg font-title-sm text-title-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                  currentStep === 1 || isSubmitting
                    ? 'opacity-40 cursor-not-allowed bg-surface-container text-outline'
                    : 'bg-surface-container hover:bg-surface-container-high text-primary cursor-pointer'
                }`}
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span>Back (पिछला कदम)</span>
              </button>

              <div className="flex items-center gap-space-md w-full sm:w-auto">
                <button
                  className="hidden md:flex h-12 px-space-md rounded-lg text-on-surface-variant hover:text-primary font-title-sm text-title-sm items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSaveProgress}
                  disabled={isSaving || isSubmitting}
                  type="button"
                >
                  {isSaving ? (
                    <span className="text-primary flex items-center gap-1.5 font-bold">
                      <div
                        className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                        role="status"
                        aria-label="Saving"
                      />
                      <span>Saving...</span>
                    </span>
                  ) : saveToast ? (
                    <span className="text-tertiary flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-sm">check</span>
                      Progress Saved
                    </span>
                  ) : (
                    'Save Progress'
                  )}
                </button>

                <button
                  className={`w-full sm:w-auto h-12 px-space-xl rounded-lg font-title-sm text-title-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                    !isStepValid || isSubmitting
                      ? 'bg-surface-container-high text-outline opacity-50 cursor-not-allowed border border-outline-variant/40 shadow-none'
                      : 'bg-secondary-container hover:bg-secondary text-on-secondary shadow-md hover:shadow-lg cursor-pointer'
                  }`}
                  onClick={handleNext}
                  disabled={!isStepValid || isSubmitting}
                  type="button"
                >
                  {isSubmitting ? (
                    <>
                      <div
                        className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"
                        role="status"
                        aria-label="Computing"
                      />
                      <span>Computing Schemes... (सिफारिश तैयार की जा रही है...)</span>
                    </>
                  ) : currentStep < 4 ? (
                    <>
                      <span>Next: {steps[currentStep].name} (आगे बढ़ें)</span>
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </>
                  ) : (
                    <>
                      <span>Compute Recommendation (सिफारिश देखें)</span>
                      <span className="material-symbols-outlined text-xl">smart_toy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Helper-text line explaining what is missing when disabled */}
            {!isStepValid && (
              <div
                className="flex items-center justify-end gap-1.5 text-right px-1 text-error"
                id="nextDisabledHelperText"
                role="status"
              >
                <span className="material-symbols-outlined text-sm shrink-0">info</span>
                <span className="font-label-sm text-label-sm leading-tight">
                  {getStepMissingMessage()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Audio Assistance & Help banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-space-md bg-surface-container-low rounded-xl gap-space-sm text-on-surface-variant text-left">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-secondary text-xl">
              record_voice_over
            </span>
            <span className="font-body-sm text-body-sm">
              Prefer vocal instructions? You can speak your numbers in Hindi, Marathi, Tamil or
              English using the microphone.
            </span>
          </div>
          <div className="flex items-center gap-space-md shrink-0">
            <a
              className="font-label-sm text-label-sm text-primary underline font-bold transition-all duration-200 hover:text-secondary"
              href="#guidelines"
              onClick={(e) => e.preventDefault()}
            >
              Portal Guidelines
            </a>
            <a
              className="font-label-sm text-label-sm text-primary underline font-bold transition-all duration-200 hover:text-secondary"
              href="#offline"
              onClick={(e) => e.preventDefault()}
            >
              Offline Paper Form
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
