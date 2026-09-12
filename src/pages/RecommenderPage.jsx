import { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../lib/formatCurrency";
import {
  recommendScheme,
  formatIndianCurrency,
  numberToIndianWords,
  PROJECT_TYPES,
  EDUCATION_STATUSES,
  SCHEMES,
} from "../lib/recommendationEngine";
import IndustrialCard from "../components/ui/IndustrialCard";
import TactileButton from "../components/ui/TactileButton";
import LedIndicator from "../components/ui/LedIndicator";
import SchemePicker from "../components/ui/SchemePicker";
import { useSchemes } from "../hooks/useSchemes";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Save,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  GraduationCap,
  Edit,
  ShieldCheck,
} from "lucide-react";

export default function RecommenderPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith("hi");
  const text = (english, hindi) => (isHindi ? hindi : english);
  const { schemes: fetchedSchemes } = useSchemes();

  // 4-step wizard local state
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    projectType: "Small trade/business",
    projectCost: "1,50,000",
    monthlyFamilyIncome: "25,000",
    educationStatus: "12th Pass",
  });

  // Voice assistance feedback simulation state
  const [isListening, setIsListening] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [computePhase, setComputePhase] = useState("idle"); // idle | loading | success
  const [computedResult, setComputedResult] = useState(null);
  const [selectedSchemeKey, setSelectedSchemeKey] = useState(null);

  // Numerical conversions
  const numericCost = useMemo(() => {
    const clean = String(answers.projectCost || "").replace(/[^0-9]/g, "");
    return clean ? parseInt(clean, 10) : 0;
  }, [answers.projectCost]);

  const numericMonthlyIncome = useMemo(() => {
    const clean = String(answers.monthlyFamilyIncome || "").replace(
      /[^0-9]/g,
      "",
    );
    return clean ? parseInt(clean, 10) : 0;
  }, [answers.monthlyFamilyIncome]);

  const annualIncome = numericMonthlyIncome * 12;
  const isIncomeOverCeiling = annualIncome > 500000;

  // Real-time scheme match peek
  const liveRecommendation = useMemo(() => {
    return recommendScheme({
      projectType: answers.projectType,
      projectCost: numericCost,
      monthlyFamilyIncome: numericMonthlyIncome,
      educationStatus: answers.educationStatus,
    });
  }, [
    answers.projectType,
    numericCost,
    numericMonthlyIncome,
    answers.educationStatus,
  ]);

  // Step definitions
  const steps = [
    {
      number: 1,
      key: "projectType",
      title: "1. Project Type",
      name: "Project Type",
    },
    {
      number: 2,
      key: "projectCost",
      title: "2. Project Cost",
      name: "Project Cost",
    },
    {
      number: 3,
      key: "monthlyFamilyIncome",
      title: "3. Family Income",
      name: "Family Income",
    },
    {
      number: 4,
      key: "educationStatus",
      title: "4. Qualifications",
      name: "Qualifications",
    },
  ];

  // Step validity checking
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return Boolean(answers.projectType);
      case 2:
        return numericCost > 0;
      case 3:
        return numericMonthlyIncome > 0;
      case 4:
        return (
          numericCost > 0 &&
          numericMonthlyIncome > 0 &&
          Boolean(answers.educationStatus)
        );
      default:
        return true;
    }
  }, [
    currentStep,
    answers.projectType,
    numericCost,
    numericMonthlyIncome,
    answers.educationStatus,
  ]);

  // Helper text explaining what's missing when button is disabled
  const getStepMissingMessage = () => {
    switch (currentStep) {
      case 1:
        return "Please select a project type to continue / कृपया प्रोजेक्ट प्रकार चुनें";
      case 2:
        return "Project cost must be a positive number greater than ₹0 / परियोजना लागत ₹0 से अधिक होनी चाहिए";
      case 3:
        return "Monthly family income must be a positive number greater than ₹0 / मासिक आय ₹0 से अधिक होनी चाहिए";
      case 4:
        if (numericCost <= 0 && numericMonthlyIncome <= 0) {
          return "Project cost and monthly family income must be positive numbers / लागत और आय दोनों ₹0 से अधिक होने चाहिए";
        }
        if (numericCost <= 0) {
          return "Project cost must be greater than ₹0 (Return to Step 2 to edit) / परियोजना लागत ₹0 से अधिक होनी चाहिए";
        }
        if (numericMonthlyIncome <= 0) {
          return "Monthly family income must be greater than ₹0 (Return to Step 3 to edit) / मासिक आय ₹0 से अधिक होनी चाहिए";
        }
        if (!answers.educationStatus) {
          return "Please select your educational qualification / कृपया शैक्षणिक योग्यता चुनें";
        }
        return null;
      default:
        return null;
    }
  };

  // Handlers
  const handleCostChange = (e) => {
    const formatted = formatIndianCurrency(e.target.value);
    setAnswers((prev) => ({ ...prev, projectCost: formatted }));
  };

  const handleIncomeChange = (e) => {
    const formatted = formatIndianCurrency(e.target.value);
    setAnswers((prev) => ({ ...prev, monthlyFamilyIncome: formatted }));
  };

  const handlePresetCost = (amount) => {
    setAnswers((prev) => ({
      ...prev,
      projectCost: formatIndianCurrency(amount),
    }));
  };

  const handlePresetIncome = (amount) => {
    setAnswers((prev) => ({
      ...prev,
      monthlyFamilyIncome: formatIndianCurrency(amount),
    }));
  };

  const isSubmitting = computePhase === "loading";
  const schemeCatalog = useMemo(() => {
    const databaseSchemes = (fetchedSchemes || []).map((scheme, index) => ({
      ...scheme,
      id:
        scheme.id ||
        scheme.scheme_key ||
        scheme.schemeKey ||
        scheme.code ||
        scheme.scheme_code ||
        `catalog-scheme-${index}`,
      title:
        scheme.title ||
        scheme.name ||
        scheme.scheme_name ||
        scheme.schemeName ||
        scheme.scheme_title,
      titleHi: scheme.titleHi || scheme.title_hi || scheme.scheme_name_hi,
      description: scheme.description || scheme.summary || scheme.details,
      descriptionHi: scheme.descriptionHi || scheme.description_hi,
      interestRate:
        scheme.interestRate ||
        scheme.interest_rate ||
        scheme.interest_rate_min ||
        scheme.rate,
      maxAmount:
        scheme.maxAmount ||
        scheme.max_amount ||
        scheme.max_loan_amount ||
        scheme.loan_amount,
      incomeCeiling:
        scheme.incomeCeiling ||
        scheme.income_ceiling ||
        scheme.income_limit ||
        scheme.max_family_income,
    }));
    const merged = [...Object.values(SCHEMES)];
    databaseSchemes.forEach((scheme) => {
      if (scheme.id && !merged.some((item) => item.id === scheme.id))
        merged.push(scheme);
    });
    return merged;
  }, [fetchedSchemes]);
  const selectedSchemeDef =
    schemeCatalog.find((scheme) => scheme.id === selectedSchemeKey) ||
    schemeCatalog.find((scheme) => scheme.id === computedResult?.schemeKey) ||
    null;
  const matchingSchemes = useMemo(() => {
    const parseAmount = (value) => {
      const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
      return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : Number.POSITIVE_INFINITY;
    };
    return schemeCatalog.filter((scheme) => {
      const maxAmount = parseAmount(scheme.maxAmount);
      const incomeCeiling = parseAmount(scheme.incomeCeiling);
      return maxAmount >= numericCost && annualIncome <= incomeCeiling;
    });
  }, [schemeCatalog, numericCost, annualIncome]);
  const selectableSchemes =
    matchingSchemes.length > 0 ? matchingSchemes : schemeCatalog;
  const liveSchemes = useMemo(() => {
    const recommended = schemeCatalog.find(
      (scheme) =>
        (scheme.id || scheme.schemeKey) === liveRecommendation.schemeKey,
    );
    const remaining = schemeCatalog.filter((scheme) => scheme !== recommended);
    return recommended ? [recommended, ...remaining] : schemeCatalog;
  }, [schemeCatalog, liveRecommendation.schemeKey]);

  const handleNext = async () => {
    if (currentStep < 4) {
      if (!isStepValid) return;
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!isStepValid || computePhase === "loading") return;

    setComputePhase("loading");
    setComputedResult(null);

    try {
      const result = recommendScheme({
        projectType: answers.projectType,
        projectCost: numericCost,
        monthlyFamilyIncome: numericMonthlyIncome,
        educationStatus: answers.educationStatus,
      });

      // Respect a scheme the user already picked from the dropdown or cards;
      // only fall back to the algorithm's top match otherwise.
      const userChoice = schemeCatalog.find(
        (scheme) => scheme.id === selectedSchemeKey,
      );
      const nextKey =
        userChoice?.id ||
        (result?.schemeKey && result.schemeKey !== "ineligible"
          ? result.schemeKey
          : schemeCatalog[0]?.id || "term_loan");

      setComputedResult(result);
      setSelectedSchemeKey(nextKey);
      setComputePhase("success");
    } catch {
      setComputePhase("idle");
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && !isSubmitting) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const buildResultNavState = (resultOverride, schemeKeyOverride) => {
    const result = resultOverride || computedResult;
    const key = schemeKeyOverride || selectedSchemeKey;
    const def = schemeCatalog.find((scheme) => scheme.id === key);
    const merged = result
      ? {
          ...result,
          schemeKey: key,
          scheme: key,
          schemeName: def?.title || result.schemeName,
          schemeNameHi: def?.titleHi || result.schemeNameHi,
          agency: def?.agency || result.agency,
          interestRate: def?.interestRate || result.interestRate,
          code: def?.code || result.code,
        }
      : result;
    return {
      result: merged,
      answers: {
        projectType: answers.projectType,
        projectCost: numericCost,
        monthlyFamilyIncome: numericMonthlyIncome,
        educationStatus: answers.educationStatus,
        projectCostFormatted: answers.projectCost,
        monthlyFamilyIncomeFormatted: answers.monthlyFamilyIncome,
        annualFamilyIncome: annualIncome,
      },
    };
  };

  const handleOpenFullReport = () => {
    navigate("/recommender/result", { state: buildResultNavState() });
  };

  const handleSaveProgress = async () => {
    if (isSaving || isSubmitting) return;
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      localStorage.setItem(
        "yojana_draft_recommender",
        JSON.stringify({
          answers,
          currentStep,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // ignore storage quota issues
    }
    setIsSaving(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 flex flex-col w-full min-h-[calc(100vh-4rem)] justify-between gap-6">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <LedIndicator
                status="active"
                label={text("PIPELINE ONLINE", "पाइपलाइन सक्रिय")}
                size="sm"
                pulse
              />
              <span className="text-chassis-dark">•</span>
              <span className="font-mono text-xs text-ink-muted uppercase tracking-wider font-semibold">
                NSFDC & NBCFDC Calibrated Algorithm v2.4
              </span>
            </div>
            <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-ink uppercase">
              Scheme Eligibility Matcher{" "}
              <span className="block md:inline font-sans text-lg md:text-xl font-normal text-ink-muted ml-0 md:ml-2">
                | अपनी पात्रता के अनुसार योजना खोजें
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-recessed shadow-recessed px-4 py-2 rounded-lg border border-chassis-dark/30 self-start md:self-auto font-mono">
            <Layers className="w-5 h-5 text-accent shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase text-ink-muted leading-none tracking-wider">
                {text("Evaluation Step", "मूल्यांकन चरण")}
              </span>
              <span className="text-xs font-bold text-ink uppercase mt-0.5">
                {text("Step", "चरण")} {currentStep} {text("of 4", "/ 4")} :{" "}
                {text(
                  steps[currentStep - 1].name,
                  ["परियोजना प्रकार", "परियोजना लागत", "पारिवारिक आय", "योग्यता"][
                    currentStep - 1
                  ],
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Conduit Stepper Rail */}
        <div className="w-full bg-panel shadow-card border border-chassis-dark/20 p-4 rounded-xl relative overflow-hidden">
          <div className="conduit-pipe absolute top-8 left-8 right-8 hidden md:block pointer-events-none opacity-60" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
            {steps.map((step) => {
              const isCompleted = step.number < currentStep;
              const isActive = step.number === currentStep;

              return (
                <div
                  key={step.number}
                  className={`flex flex-col gap-2 p-2.5 rounded-lg border transition-all ${
                    isActive
                      ? "bg-chassis shadow-card border-accent/60"
                      : isCompleted
                        ? "bg-recessed/60 shadow-recessed border-chassis-dark/30"
                        : "bg-chassis/40 border-chassis-dark/15 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] font-bold tracking-wider uppercase ${
                        isActive
                          ? "text-accent"
                          : isCompleted
                            ? "text-emerald-700"
                            : "text-ink-muted"
                      }`}
                    >
                      Terminal 0{step.number}
                    </span>
                    <LedIndicator
                      status={
                        isCompleted
                          ? "success"
                          : isActive
                            ? "warning"
                            : "inactive"
                      }
                      size="sm"
                      pulse={isActive}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-accent text-white"
                            : "bg-recessed text-ink-muted"
                        }`}
                      >
                        {step.number}
                      </span>
                    )}
                    <span
                      className={`font-mono text-xs truncate ${
                        isActive
                          ? "text-ink font-bold"
                          : isCompleted
                            ? "text-ink font-medium"
                            : "text-ink-muted"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Step Focus Card */}
        <IndustrialCard
          cornerScrews={true}
          ventSlots={true}
          className="p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden text-left"
        >
          {/* Sector Snapshot Banner (Visible when beyond step 1) */}
          {currentStep > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-recessed shadow-recessed p-3.5 rounded-lg border border-chassis-dark/25 font-mono">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-panel shadow-card text-accent flex items-center justify-center border border-chassis-dark/20">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-ink-muted leading-none tracking-wider">
                    Sector Selected in Step 1
                  </span>
                  <span className="text-xs font-bold text-ink uppercase mt-0.5">
                    {answers.projectType} (
                    {PROJECT_TYPES.find((p) => p.id === answers.projectType)
                      ?.labelHi || ""}
                    )
                  </span>
                </div>
              </div>
              <TactileButton
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setCurrentStep(1)}
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                Recalibrate
              </TactileButton>
            </div>
          )}

          {/* ================= STEP 1: PROJECT TYPE ================= */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-mono text-lg md:text-xl font-bold text-ink uppercase tracking-tight">
                    {text(
                      "What type of project or venture are you planning?",
                      "आप किस प्रकार के प्रोजेक्ट या व्यवसाय की योजना बना रहे हैं?",
                    )}
                  </h2>
                  <span className="block font-sans text-sm text-ink-muted mt-0.5 font-normal">
                    {text(
                      "Answer a few questions and we will find the schemes you qualify for.",
                      "कुछ प्रश्नों के उत्तर दें और हम आपकी पात्र योजनाएँ खोज देंगे।",
                    )}
                  </span>
                </div>
                <TactileButton
                  variant={isListening ? "primary" : "secondary"}
                  size="sm"
                  className={`shrink-0 flex flex-col items-center justify-center p-2 h-auto ${
                    isListening ? "animate-pulse" : ""
                  }`}
                  onClick={() => setIsListening(!isListening)}
                  title={text(
                    "Tap to dictate in Hindi or English",
                    "हिंदी या अंग्रेज़ी में बोलें",
                  )}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-wider mt-0.5">
                    {isListening
                      ? text("Stop", "रोकें")
                      : text("Speak", "बोलें")}
                  </span>
                </TactileButton>
              </div>
              <p className="font-sans text-xs md:text-sm text-ink-muted max-w-2xl leading-relaxed">
                {text(
                  "Select the primary sector that describes your economic initiative or educational aspiration. Concessional welfare credit is channeled according to approved MoSJE activity codes.",
                  "अपने आर्थिक प्रोजेक्ट या शैक्षणिक लक्ष्य का मुख्य क्षेत्र चुनें। रियायती ऋण स्वीकृत MoSJE गतिविधि कोड के अनुसार दिया जाता है।",
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {PROJECT_TYPES.map((item) => {
                  const isSelected = answers.projectType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          projectType: item.id,
                        }))
                      }
                      className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between min-h-[110px] cursor-pointer border ${
                        isSelected
                          ? "bg-chassis shadow-pressed border-accent ring-1 ring-accent translate-y-[1px]"
                          : "bg-panel shadow-card hover:shadow-floating hover:-translate-y-0.5 border-chassis-dark/20 text-ink"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-xl text-accent">
                            {item.icon}
                          </span>
                          <span className="font-mono text-sm font-bold leading-tight uppercase text-ink">
                            {item.label}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                        )}
                      </div>
                      <span className="font-sans text-xs text-accent font-semibold">
                        {item.labelHi}
                      </span>
                      <p className="font-sans text-xs mt-1 text-ink-muted line-clamp-2">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STEP 2: PROJECT COST ================= */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-mono text-lg md:text-xl font-bold text-ink uppercase tracking-tight">
                    {text(
                      "What is your estimated total project cost?",
                      "आपके प्रोजेक्ट की अनुमानित कुल लागत कितनी है?",
                    )}
                  </h2>
                  <span className="block font-sans text-sm text-ink-muted mt-0.5 font-normal">
                    आपके प्रोजेक्ट की अनुमानित कुल लागत कितनी है?
                  </span>
                </div>
                <TactileButton
                  variant={isListening ? "primary" : "secondary"}
                  size="sm"
                  className={`shrink-0 flex flex-col items-center justify-center p-2 h-auto ${
                    isListening ? "animate-pulse" : ""
                  }`}
                  onClick={() => setIsListening(!isListening)}
                  title={text(
                    "Tap to dictate amount in Hindi or English",
                    "हिंदी या अंग्रेज़ी में बोलकर राशि बताएं",
                  )}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-wider mt-0.5">
                    {isListening
                      ? text("Stop", "रोकें")
                      : text("Speak", "बोलें")}
                  </span>
                </TactileButton>
              </div>
              <p className="font-sans text-xs md:text-sm text-ink-muted max-w-2xl leading-relaxed">
                {text(
                  "Include machinery, furniture, raw inventory, and initial operational funds. You do not need exact quotations — an approximate working capital budget is sufficient.",
                  "मशीनरी, फर्नीचर, कच्चे माल की सूची और प्रारंभिक परिचालन धन शामिल करें। सटीक कोटेशन की आवश्यकता नहीं है — अनुमानित बजट पर्याप्त है।",
                )}
              </p>

              {/* Financial Input Block */}
              <div className="flex flex-col gap-4 pt-1">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="font-mono text-xs uppercase font-bold text-ink flex items-center gap-1.5"
                      htmlFor="projectCostInput"
                    >
                      <span>
                        {text("Capital Requirement", "परियोजना लागत")} // परियोजना लागत
                      </span>
                    </label>
                    <span className="font-mono text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {text(
                        `Verified Limit up to ${formatCurrency(1500000)}`,
                        `सत्यापित सीमा ${formatCurrency(1500000)} तक`,
                      )}
                    </span>
                  </div>
                  <div
                    className={`relative flex items-stretch h-14 w-full rounded-lg bg-recessed shadow-recessed overflow-hidden border transition-all ${
                      numericCost <= 0
                        ? "border-accent ring-1 ring-accent"
                        : "border-chassis-dark/40"
                    }`}
                  >
                    <div className="bg-chassis px-4 flex items-center justify-center text-ink font-mono text-lg font-bold border-r border-chassis-dark/30 select-none">
                      ₹
                    </div>
                    <input
                      aria-label="Estimated project cost in Indian Rupees"
                      className="w-full bg-transparent px-4 font-mono text-xl text-ink font-bold tracking-tight focus:outline-none placeholder:text-ink-muted/40"
                      id="projectCostInput"
                      placeholder="0"
                      type="text"
                      value={answers.projectCost}
                      onChange={handleCostChange}
                    />
                    <div className="px-4 flex items-center text-ink-muted font-mono text-xs font-semibold uppercase select-none">
                      INR
                    </div>
                  </div>
                  {numericCost <= 0 ? (
                    <p className="font-mono text-xs text-accent flex items-center gap-1.5 mt-2 pl-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {text(
                          "Project cost must be a positive number greater than ₹0",
                          "परियोजना लागत ₹0 से अधिक होनी चाहिए",
                        )}
                        (परियोजना लागत ₹0 से अधिक होनी चाहिए)
                      </span>
                    </p>
                  ) : (
                    <div className="mt-2 pl-1 flex flex-wrap items-center gap-2 font-mono text-xs text-ink-muted">
                      <span>
                        {text("Amount in words:", "राशि शब्दों में:")}
                      </span>
                      <strong className="text-ink bg-panel px-2 py-0.5 rounded shadow-xs border border-chassis-dark/20 text-[11px]">
                        {numberToIndianWords(numericCost)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Quick Select Preset Chips */}
                <div className="flex flex-col gap-2 pt-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                    {text("Benchmark Presets", "मानक विकल्प")} // मानक विकल्प
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      {
                        amount: 50000,
                        label: "₹50,000",
                        sub: "Micro Venture (सूक्ष्म उद्यम)",
                      },
                      {
                        amount: 150000,
                        label: "₹1.5 Lakh",
                        sub: "Service / Retail (दुकान)",
                      },
                      {
                        amount: 300000,
                        label: "₹3.0 Lakh",
                        sub: "Small Workshop (कार्यशाला)",
                      },
                      {
                        amount: 500000,
                        label: "₹5.0 Lakh",
                        sub: "Processing / Dairy (डेयरी)",
                      },
                    ].map((preset) => {
                      const isSelected = numericCost === preset.amount;
                      return (
                        <button
                          key={preset.amount}
                          className={`text-left p-3 rounded-lg transition-all flex flex-col justify-between h-20 border cursor-pointer ${
                            isSelected
                              ? "bg-chassis shadow-pressed border-accent ring-1 ring-accent translate-y-[1px]"
                              : "bg-panel shadow-card hover:shadow-floating hover:-translate-y-0.5 border-chassis-dark/20 text-ink"
                          }`}
                          onClick={() => handlePresetCost(preset.amount)}
                          type="button"
                        >
                          <span className="font-mono text-sm font-bold text-ink">
                            {preset.label}
                          </span>
                          <span className="font-sans text-[11px] text-ink-muted leading-tight truncate">
                            {preset.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: MONTHLY FAMILY INCOME ================= */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-mono text-lg md:text-xl font-bold text-ink uppercase tracking-tight">
                    {text(
                      "What is your monthly family income?",
                      "आपकी मासिक पारिवारिक आय कितनी है?",
                    )}
                  </h2>
                  <span className="block font-sans text-sm text-ink-muted mt-0.5 font-normal">
                    आपकी मासिक पारिवारिक आय कितनी है?
                  </span>
                </div>
                <TactileButton
                  variant={isListening ? "primary" : "secondary"}
                  size="sm"
                  className={`shrink-0 flex flex-col items-center justify-center p-2 h-auto ${
                    isListening ? "animate-pulse" : ""
                  }`}
                  onClick={() => setIsListening(!isListening)}
                  title={text(
                    "Tap to dictate monthly income",
                    "मासिक आय बोलकर बताएं",
                  )}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-wider mt-0.5">
                    {isListening
                      ? text("Stop", "रोकें")
                      : text("Speak", "बोलें")}
                  </span>
                </TactileButton>
              </div>
              <p className="font-sans text-xs md:text-sm text-ink-muted max-w-2xl leading-relaxed">
                {text(
                  "Combine the gross earnings of all earning members of the household. MoSJE concessional schemes feature an annual family income ceiling",
                  "परिवार के सभी सदस्यों की सकल आय जोड़ें। MoSJE रियायती योजनाओं में अधिकतम सब्सिडी हेतु वार्षिक पारिवारिक आय सीमा",
                )}{" "}
                {formatCurrency(500000)}
                {text(" for maximum subsidy benefit.", " है।")}
              </p>

              {/* Income Input Block */}
              <div className="flex flex-col gap-4 pt-1">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="font-mono text-xs uppercase font-bold text-ink"
                      htmlFor="incomeInput"
                    >
                      {text("Monthly Household Revenue", "मासिक आय")} // मासिक आय
                    </label>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <LedIndicator
                        status={isIncomeOverCeiling ? "error" : "success"}
                        size="sm"
                      />
                      <span
                        className={
                          isIncomeOverCeiling
                            ? "text-accent font-bold"
                            : "text-emerald-700 font-semibold"
                        }
                      >                        {isIncomeOverCeiling
                          ? text(
                              "Exceeds ₹5 Lakh/yr ceiling",
                              "₹5 लाख/वर्ष सीमा से अधिक",
                            )
                          : text(
                              "Within ₹5 Lakh/yr ceiling",
                              "₹5 लाख/वर्ष सीमा के भीतर",
                            )}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`relative flex items-stretch h-14 w-full rounded-lg bg-recessed shadow-recessed overflow-hidden border transition-all ${
                      numericMonthlyIncome <= 0
                        ? "border-accent ring-1 ring-accent"
                        : "border-chassis-dark/40"
                    }`}
                  >
                    <div className="bg-chassis px-4 flex items-center justify-center text-ink font-mono text-lg font-bold border-r border-chassis-dark/30 select-none">
                      ₹
                    </div>
                    <input
                      aria-label="Monthly household income in Indian Rupees"
                      className="w-full bg-transparent px-4 font-mono text-xl text-ink font-bold tracking-tight focus:outline-none placeholder:text-ink-muted/40"
                      id="incomeInput"
                      placeholder="0"
                      type="text"
                      value={answers.monthlyFamilyIncome}
                      onChange={handleIncomeChange}
                    />
                    <div className="px-4 flex items-center text-ink-muted font-mono text-xs font-semibold select-none">
                      / month
                    </div>
                  </div>

                  {numericMonthlyIncome <= 0 ? (
                    <p className="font-mono text-xs text-accent flex items-center gap-1.5 mt-2 pl-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {text(
                          "Monthly family income must be a positive number greater than ₹0",
                          "मासिक आय ₹0 से अधिक होनी चाहिए",
                        )}
                        (मासिक आय ₹0 से अधिक होनी चाहिए)
                      </span>
                    </p>
                  ) : (
                    /* Computed Annual Income Indicator */
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 p-3 rounded-lg bg-recessed shadow-recessed border border-chassis-dark/25 font-mono text-xs">
                      <span className="text-ink-muted">
                        {text("Computed Annual Income:", "संगणित वार्षिक आय:")}{" "}
                        <strong className="text-ink font-bold">
                          {formatCurrency(annualIncome)}
                          {text(" / year", " / वर्ष")}
                        </strong>{" "}
                        <span className="text-[11px] text-ink-muted">
                          ({numberToIndianWords(numericMonthlyIncome)} / mo)
                        </span>
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isIncomeOverCeiling
                            ? "bg-accent/15 text-accent border border-accent/30"
                            : "bg-emerald-600/15 text-emerald-700 border border-emerald-600/30"
                        }`}
                      >                        {isIncomeOverCeiling
                          ? text(
                              "Income Exceeds ₹5L Ceiling",
                              "आय ₹5 लाख सीमा से अधिक",
                            )
                          : text(
                              "Welfare Subsidized Status: Approved",
                              "कल्याणकारी सब्सिडी स्थिति: स्वीकृत",
                            )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Select Presets for Monthly Income */}
                <div className="flex flex-col gap-2 pt-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                    {text(
                      "Common Income Benchmarks",
                      "मानक आय स्तर",
                    )} // मानक आय स्तर
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      {
                        amount: 15000,
                        label: "₹15,000",
                        sub: "Annual: ₹1.80 Lakh",
                      },
                      {
                        amount: 25000,
                        label: "₹25,000",
                        sub: "Annual: ₹3.00 Lakh",
                      },
                      {
                        amount: 35000,
                        label: "₹35,000",
                        sub: "Annual: ₹4.20 Lakh",
                      },
                      {
                        amount: 50000,
                        label: "₹50,000",
                        sub: "Annual: ₹6.00 Lakh (Ceiling)",
                      },
                    ].map((preset) => {
                      const isSelected = numericMonthlyIncome === preset.amount;
                      return (
                        <button
                          key={preset.amount}
                          className={`text-left p-3 rounded-lg transition-all flex flex-col justify-between h-20 border cursor-pointer ${
                            isSelected
                              ? "bg-chassis shadow-pressed border-accent ring-1 ring-accent translate-y-[1px]"
                              : "bg-panel shadow-card hover:shadow-floating hover:-translate-y-0.5 border-chassis-dark/20 text-ink"
                          }`}
                          onClick={() => handlePresetIncome(preset.amount)}
                          type="button"
                        >
                          <span className="font-mono text-sm font-bold text-ink">
                            {preset.label}
                          </span>
                          <span className="font-sans text-[11px] text-ink-muted leading-tight truncate">
                            {preset.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: EDUCATION STATUS ================= */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-mono text-lg md:text-xl font-bold text-ink uppercase tracking-tight">
                    {text(
                      "What is your highest educational qualification?",
                      "आपकी उच्चतम शैक्षणिक योग्यता क्या है?",
                    )}
                  </h2>
                  <span className="block font-sans text-sm text-ink-muted mt-0.5 font-normal">
                    आपकी उच्चतम शैक्षणिक योग्यता क्या है?
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-panel shadow-card border border-chassis-dark/25 text-accent flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <p className="font-sans text-xs md:text-sm text-ink-muted max-w-2xl leading-relaxed">
                {text(
                  "Qualifications determine eligibility for special skill-subvention programs, technical incubation, and higher education loan subventions under MoSJE corporations.",
                  "योग्यता MoSJE निगमों के अंतर्गत विशेष कौशल-सहायता कार्यक्रमों, तकनीकी इनक्यूबेशन और उच्च शिक्षा ऋण सहायता के लिए पात्रता तय करती है।",
                )}
              </p>

              {/* Dropdown Selection */}
              <div className="flex flex-col gap-2 pt-1">
                <label
                  className="font-mono text-xs uppercase font-bold text-ink"
                  htmlFor="educationSelect"
                >
                  {text(
                    "Credential Level",
                    "शैक्षणिक योग्यता",
                  )} // शैक्षणिक योग्यता चुनें
                </label>
                <div className="relative w-full">
                  <select
                    id="educationSelect"
                    value={answers.educationStatus}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        educationStatus: e.target.value,
                      }))
                    }
                    className="w-full h-12 pl-4 pr-10 bg-recessed text-ink font-mono text-sm font-bold rounded-lg border border-chassis-dark/40 shadow-recessed focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer transition-all"
                  >
                    {EDUCATION_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none text-2xl">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              {/* Review Summary of All Inputs */}
              <div className="mt-2 p-4 rounded-xl bg-recessed shadow-recessed flex flex-col gap-3 border border-chassis-dark/30">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-ink flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    {text(
                      "Parameter Verification Matrix",
                      "पैरामीटर सत्यापन सारांश",
                    )} // सारांश
                  </span>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                    {text("Ready for Computation", "गणना के लिए तैयार")}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-3 bg-panel rounded-lg shadow-card border border-chassis-dark/20">
                    <span className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                      {text("Sector / Activity", "क्षेत्र / गतिविधि")}
                    </span>
                    <span className="font-mono text-xs text-ink font-bold mt-1 block truncate">
                      {answers.projectType}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-lg border ${numericCost <= 0 ? "bg-accent/10 border-accent" : "bg-panel shadow-card border-chassis-dark/20"}`}
                  >
                    <span className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                      {text("Project Cost", "परियोजना लागत")}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold mt-1 block ${numericCost <= 0 ? "text-accent flex items-center gap-1" : "text-ink"}`}
                    >
                      {numericCost > 0 ? (
                        formatCurrency(answers.projectCost)
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          {text("Required (> ₹0)", "आवश्यक (> ₹0)")}
                        </>
                      )}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-lg border ${numericMonthlyIncome <= 0 ? "bg-accent/10 border-accent" : "bg-panel shadow-card border-chassis-dark/20"}`}
                  >
                    <span className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                      {text("Household Income", "घरेलू आय")}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold mt-1 block ${numericMonthlyIncome <= 0 ? "text-accent flex items-center gap-1" : "text-ink"}`}
                    >
                      {numericMonthlyIncome > 0 ? (
                        <>
                          {formatCurrency(answers.monthlyFamilyIncome)}{" "}
                          <span className="text-[10px] text-ink-muted font-normal">
                            ({formatCurrency(annualIncome)}/yr)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          {text("Required (> ₹0)", "आवश्यक (> ₹0)")}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="p-3 bg-panel rounded-lg shadow-card border border-chassis-dark/20">
                    <span className="block font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                      {text("Qualification", "योग्यता")}
                    </span>
                    <span className="font-mono text-xs text-ink font-bold mt-1 block truncate">
                      {answers.educationStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regulatory Insight Box */}
          <div className="bg-panel shadow-card border border-chassis-dark/25 p-4 rounded-xl flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-chassis shadow-pressed text-accent shrink-0 flex items-center justify-center border border-chassis-dark/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase font-bold text-ink tracking-wider">
                {text("Statutory Intelligence Telemetry", "वैधानिक जानकारी")}
              </span>
              <p className="font-sans text-xs text-ink-muted leading-relaxed">
                {currentStep === 1 && (
                  <>
                    Beneficiaries in <strong>Small trade</strong>,{" "}
                    <strong>Manufacturing</strong>, and{" "}
                    <strong>Higher education</strong> qualify for preferential
                    credit windows under NSFDC (SCs) and NBCFDC (OBCs)
                    corporations.
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    Did you know? Projects up to{" "}
                    <strong>{formatCurrency(140000)}</strong> qualify for the{" "}
                    <em>NBCFDC Micro Finance Scheme</em> with an accelerated
                    7-day single-window verification and zero collateral
                    mortgage requirements.
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    Under statutory MoSJE guidelines, applicant families with
                    annual income up to{" "}
                    <strong>{formatCurrency(500000)}</strong> receive maximum
                    interest subventions down to <strong>4.0% p.a.</strong>{" "}
                    Annual income above {formatCurrency(500000)} falls outside
                    welfare subsidized loan ceilings.
                  </>
                )}                  {currentStep === 4 && (
                  <>
                    {text(
                      "Higher technical qualifications and verified matriculation certifications enable fast-track sanctioning under National Corporation State Channelising Agencies (SCAs).",
                      "उच्च तकनीकी योग्यता और सत्यापित मैट्रिक प्रमाणपत्र राष्ट्रीय निगम राज्य संचालन एजेंसियों (SCAs) के अंतर्गत तीव्र-गति स्वीकृति सक्षम करते हैं।",
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Live Matched Schemes Dynamic Peek */}
          <div className="bg-recessed shadow-recessed rounded-xl p-4 flex flex-col gap-3 border border-chassis-dark/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LedIndicator
                  status={liveRecommendation.eligible ? "success" : "error"}
                  size="sm"
                  pulse={liveRecommendation.eligible}
                />
                <span className="font-mono text-xs uppercase font-bold text-ink tracking-wider">
                  {text("Live Scheme Matching Peek", "लाइव योजना मिलान")}
                </span>
              </div>
              <span
                className={`font-mono text-[10px] uppercase px-2.5 py-0.5 rounded font-bold tracking-wider ${
                  liveRecommendation.eligible
                    ? "bg-emerald-600/15 text-emerald-700 border border-emerald-600/30"
                    : "bg-accent/15 text-accent border border-accent/30"
                }`}
              >
                {liveRecommendation.eligible
                  ? text("Candidate Match Available", "संभावित योजना उपलब्ध")
                  : text("Income Ceiling Limit Exceeded", "आय सीमा पार")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {liveSchemes.slice(0, 6).map((scheme) => {
                const schemeId = scheme.id || scheme.schemeKey;
                const isSelected = selectedSchemeKey === schemeId;
                const isRecommended = liveRecommendation.schemeKey === schemeId;
                return (
                  <button
                    key={schemeId}
                    type="button"
                    onClick={() => setSelectedSchemeKey(schemeId)}
                    className={`p-3.5 rounded-lg text-left flex flex-col justify-between border transition-all ${
                      isSelected
                        ? "bg-chassis shadow-pressed border-accent ring-2 ring-accent/60"
                        : "bg-panel shadow-card border-chassis-dark/20 hover:shadow-floating"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-accent uppercase font-bold tracking-wider">
                          {isRecommended
                            ? text("Recommended match", "अनुशंसित मिलान")
                            : text("Available scheme", "उपलब्ध योजना")}
                        </span>
                        {isRecommended && (
                          <span className="text-[9px] bg-accent text-white px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                            TOP MATCH
                          </span>
                        )}
                      </div>
                      <h4 className="font-mono text-xs font-bold text-ink mt-1 leading-snug">
                        {(isHindi && (scheme.titleHi || scheme.title_hi)) ||
                          scheme.title ||
                          scheme.name ||
                          scheme.schemeName ||
                          schemeId}
                      </h4>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-700 font-semibold mt-2.5">
                      {scheme.interestRate ||
                        text("Rate not provided", "दर उपलब्ध नहीं")}
                    </span>
                  </button>
                );
              })}
              {!liveRecommendation.eligible && (
                <div className="col-span-3 p-4 rounded-lg bg-accent/10 border border-accent/40 text-ink">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-accent mb-1 uppercase tracking-wide">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {text("Income ceiling advisory", "आय सीमा सूचना")}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-ink-muted leading-relaxed">
                    {liveRecommendation.reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Navigation Bar */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-chassis-dark/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <TactileButton
                variant="secondary"
                size="md"
                className="w-full sm:w-auto"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                {text("Back", "पिछला कदम")}
              </TactileButton>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <TactileButton
                  variant="ghost"
                  size="md"
                  className="hidden md:flex text-xs"
                  onClick={handleSaveProgress}
                  disabled={isSaving || isSubmitting}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-1.5 font-mono">
                      <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      <span>{text("SAVING...", "सहेज रहे हैं...")}</span>
                    </span>
                  ) : saveToast ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-mono font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {text("SAVED", "सहेजा गया")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5" />
                      {text("Save Progress", "प्रगति सहेजें")}
                    </span>
                  )}
                </TactileButton>

                <TactileButton
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto min-w-[280px]"
                  onClick={handleNext}
                  disabled={!isStepValid || isSubmitting}
                >
                  {computePhase === "loading" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>
                        {text(
                          "Computing…",
                          "सिफारिश तैयार हो रही है…",
                        )}
                      </span>
                    </>
                  ) : computePhase === "success" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {text(
                          "Match ready — recompute",
                          "मिलान तैयार — पुनः गणना करें",
                        )}
                      </span>
                    </>
                  ) : currentStep < 4 ? (
                    <>
                      <span>
                        {text("Next:", "आगे:")} {text(
                          steps[currentStep].name,
                          ["परियोजना लागत", "पारिवारिक आय", "योग्यता"][
                            currentStep - 1
                          ] || "",
                        )}
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  ) : (
                    <>
                      <span>
                        {text(
                          "Compute Scheme",
                          "सिफारिश देखें",
                        )}
                      </span>
                      <Sparkles className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </TactileButton>
              </div>
            </div>

            {/* Helper-text line explaining what is missing when disabled */}
            {!isStepValid && (
              <div
                className="flex items-center justify-end gap-1.5 text-right px-1 text-accent font-mono text-xs"
                id="nextDisabledHelperText"
                role="status"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-tight">{getStepMissingMessage()}</span>
              </div>
            )}
          </div>
        </IndustrialCard>

        <IndustrialCard className="p-5 text-left" cornerScrews>
          <label
            htmlFor="matchingSchemeSelect"
            className="block font-mono text-xs font-bold uppercase tracking-wider text-ink"
          >
            {text(
              "Select from matching schemes",
              "पात्र योजनाओं में से चुनें",
            )} // पात्र योजनाएँ चुनें
          </label>
          <select
            id="matchingSchemeSelect"
            value={selectedSchemeKey || ""}
            onChange={(event) =>
              setSelectedSchemeKey(event.target.value || null)
            }
            className="mt-2 w-full h-12 px-3 rounded-lg bg-recessed border border-chassis-dark/30 text-ink font-mono text-sm"
          >
            <option value="">
              {text(
                "Choose a scheme that meets your inputs",
                "अपनी जानकारी के अनुरूप योजना चुनें",
              )}
            </option>
            {selectableSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {(isHindi &&
                  (scheme.titleHi ||
                    scheme.title_hi ||
                    scheme.title ||
                    scheme.name ||
                    scheme.schemeName)) ||
                  scheme.title ||
                  scheme.name ||
                  scheme.schemeName}{" "}
                {scheme.interestRate ? ` - ${scheme.interestRate}` : ""}
              </option>
            ))}
          </select>
          {matchingSchemes.length === 0 && schemeCatalog.length > 0 && (
            <p className="mt-2 font-mono text-xs text-accent">
              {text(
                "No exact eligibility match was found. The full scheme catalog remains selectable for review.",
                "कोई सटीक पात्रता मिलान नहीं मिला। समीक्षा हेतु पूरी योजना सूची चयन हेतु उपलब्ध है।",
              )}
            </p>
          )}
        </IndustrialCard>

        {computePhase === "success" && computedResult && (
          <IndustrialCard
            cornerScrews
            ventSlots
            className="p-6 md:p-8 flex flex-col gap-5 text-left"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center shadow-pressed">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    {text("Computation complete", "गणना पूर्ण")}
                  </p>
                  <h3 className="font-mono text-lg font-bold uppercase text-ink">
                    {computedResult.eligible
                      ? text("Primary match locked", "प्राथमिक मिलान निश्चित")
                      : text("Ceiling advisory issued", "आय सीमा सलाह जारी")}
                  </h3>
                </div>
              </div>
              <LedIndicator
                status={computedResult.eligible ? "success" : "error"}
                label={computedResult.eligible ? "ELIGIBLE" : "CEILING"}
                size="sm"
                pulse={computedResult.eligible}
              />
            </div>

            <SchemePicker
              schemes={schemeCatalog}
              selectedId={selectedSchemeKey}
              recommendedId={computedResult.schemeKey}
              onSelect={(id) => setSelectedSchemeKey(id)}
            />

            {selectedSchemeDef && (
              <div className="p-4 rounded-xl bg-recessed shadow-recessed border border-chassis-dark/25 font-mono text-xs space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">
                  Active window
                </p>
                <p className="text-sm font-bold text-ink uppercase">
                  {selectedSchemeDef.title}
                </p>
                <p className="font-sans text-xs text-ink-muted leading-relaxed">
                  {selectedSchemeDef.description}
                </p>
                <div className="flex flex-wrap gap-3 pt-1 text-[11px]">
                  <span className="text-accent font-bold">
                    {selectedSchemeDef.interestRate}
                  </span>
                  <span className="text-ink-muted">
                    Max {selectedSchemeDef.maxAmountFormatted}
                  </span>
                  <span className="text-ink-muted">
                    {selectedSchemeDef.loanRatio}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <TactileButton
                variant="primary"
                size="md"
                onClick={handleOpenFullReport}
              >
                <span>{text("Open full report", "पूरी रिपोर्ट खोलें")}</span>
                <ArrowRight className="w-4 h-4" />
              </TactileButton>
              <TactileButton
                variant="secondary"
                size="md"
                onClick={() =>
                  navigate("/calculator", {
                    state: {
                      schemeId: selectedSchemeKey,
                      scheme: selectedSchemeDef,
                      suggestedAmount: Math.min(
                        numericCost || 135000,
                        selectedSchemeDef?.maxAmount || 500000,
                      ),
                      answers: buildResultNavState().answers,
                    },
                  })
                }
              >
                {text("Preview EMI", "ईएमआई देखें")}
              </TactileButton>
            </div>
          </IndustrialCard>
        )}

        {/* Bottom Audio Assistance & Help banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-panel shadow-card border border-chassis-dark/20 rounded-xl gap-3 text-ink-muted text-left">            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-accent shrink-0" />
              <span className="font-sans text-xs">
                {text(
                  "Prefer vocal instructions? You can speak your numbers in Hindi, Marathi, Tamil or English using the microphone.",
                  "बोलकर बताना चाहेंगे? माइक्रोफ़ोन से आप हिंदी, मराठी, तमिल या अंग्रेज़ी में अपनी राशि बता सकते हैं।",
                )}
              </span>
            </div>
            <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
              <NavLink
                to="/help"
                className="text-ink hover:text-accent underline font-semibold transition-colors"
              >
                {text("Guidelines", "दिशानिर्देश")}
              </NavLink>
              <NavLink
                to="/help#paperform"
                className="text-ink hover:text-accent underline font-semibold transition-colors"
              >
                {text("Paper Form", "कागज़ी प्रपत्र")}
              </NavLink>
            </div>
        </div>
      </div>

      {/* Official Chassis Footer */}
      <footer className="w-full bg-panel shadow-card border border-chassis-dark/20 py-3 px-6 rounded-xl font-mono text-xs text-ink-muted mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            Ministry of Social Justice & Empowerment • Government of India //
            YojanaSetu Terminal
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Certified Data Privacy
            </span>
            <span>Helpline: 1800-11-7788</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
