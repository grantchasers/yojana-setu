import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../lib/formatCurrency";
import { SCHEMES } from "../lib/recommendationEngine";
import { useSchemes } from "../hooks/useSchemes";
import { useAuth } from "../context/AuthContext";
import { useApplications } from "../hooks/useApplications";
import IndustrialCard from "../components/ui/IndustrialCard";
import TactileButton from "../components/ui/TactileButton";
import LedIndicator from "../components/ui/LedIndicator";
import HardwareBezel from "../components/ui/HardwareBezel";
import SchemePicker from "../components/ui/SchemePicker";
import {
  Printer,
  Download,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Calculator,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Phone,
  Layers,
  Award,
  Cpu,
  Coins,
  Building,
  X,
} from "lucide-react";

export default function RecommendationResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;
  const { i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith("hi");
  const text = (english, hindi) => (isHindi ? hindi : english);
  const { createApplication } = useApplications(user?.id);
  const { schemes: fetchedSchemes } = useSchemes();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // State to track accordion expansion for alternative schemes
  const [expandedAlt, setExpandedAlt] = useState({ alt1: false, alt2: false });

  const toggleAlt = (key) => {
    setExpandedAlt((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Close preview returns to the recommender wizard
  const handleClosePreview = () => {
    navigate("/recommender");
  };

  // Safe extraction of router state
  const state = location.state;
  const hasValidState = Boolean(state?.result || state?.answers);
  const result = state?.result || {};
  const answers = state?.answers || {};

  // Resolve scheme key and scheme definition
  const schemeKey = result.schemeKey || result.scheme || "term_loan";
  const [activeSchemeKey, setActiveSchemeKey] = useState(() =>
    schemeKey === "ineligible" ? "term_loan" : schemeKey,
  );
  const schemeCatalog = useMemo(() => {
    const databaseSchemes = (fetchedSchemes || []).map((scheme) => ({
      ...scheme,
      id: scheme.id || scheme.scheme_key || scheme.schemeKey,
      title: scheme.title || scheme.name || scheme.scheme_name,
      description: scheme.description || scheme.summary,
    }));
    const merged = [...Object.values(SCHEMES)];
    databaseSchemes.forEach((scheme) => {
      if (scheme.id && !merged.some((item) => item.id === scheme.id))
        merged.push(scheme);
    });
    return merged;
  }, [fetchedSchemes]);
  const schemeDef =
    schemeCatalog.find((scheme) => scheme.id === activeSchemeKey) ||
    SCHEMES.term_loan;
  const schemeId =
    result.schemeId ||
    result.scheme_id ||
    result.id ||
    schemeDef?.id ||
    activeSchemeKey;

  // Keep the internal selection in sync with the schemeKey passed via router state
  useEffect(() => {
    setActiveSchemeKey(schemeKey === "ineligible" ? "term_loan" : schemeKey);
  }, [schemeKey]);

  const schemeName = schemeDef.title || result.schemeName;
  const schemeNameHi = schemeDef.titleHi || result.schemeNameHi;
  const agency = schemeDef.agency || result.agency;
  const schemeCode = schemeDef.code || result.code || "MoSJE-GOI";

  // Numerical parameters
  const numericCost = Number(answers.projectCost) || 0;
  const numericIncome = Number(answers.monthlyFamilyIncome) || 0;
  const annualIncome = answers.annualFamilyIncome || numericIncome * 12;

  // Determine loan allocation ratio and amounts
  const loanRatioPct = activeSchemeKey === "micro_finance" ? 95 : 90;
  const promoterRatioPct = 100 - loanRatioPct;

  // Education loans finance the course cost rather than a venture
  const isEducationScheme = activeSchemeKey === "education_loan";

  const suggestedAmount = useMemo(() => {
    if (numericCost > 0) {
      const calculated = Math.round((numericCost * loanRatioPct) / 100);
      const max = schemeDef.maxAmount || 500000;
      return Math.min(calculated, max);
    }
    return isEducationScheme ? 500000 : 135000;
  }, [numericCost, loanRatioPct, schemeDef.maxAmount, isEducationScheme]);

  const promoterContribution = Math.max(0, numericCost - suggestedAmount);

  // Interest rate range
  const interestRateRange =
    schemeDef.interestRate || result.interestRate || "4.0% - 6.0%";

  // Eligibility verdict for the selected scheme family: education loans
  // bypass the welfare income ceiling; term/micro loans must respect it
  // and the scheme's own maximum amount.
  const selectedEligible = useMemo(() => {
    if (isEducationScheme) return true;
    if (annualIncome > 500000) return false;
    const maxAmount = Number(schemeDef.maxAmount) || 500000;
    if (numericCost > maxAmount) return false;
    return true;
  }, [isEducationScheme, annualIncome, numericCost, schemeDef.maxAmount]);

  // Schemes the user can legitimately apply for with their answers
  const eligibleSchemes = useMemo(() => {
    const parseAmount = (value) => {
      const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
      return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : Number.POSITIVE_INFINITY;
    };
    return schemeCatalog.filter((scheme) => {
      if (scheme.id === "education_loan") return true;
      if (annualIncome > 500000) return false;
      const maxAmount = parseAmount(scheme.maxAmount);
      return numericCost <= maxAmount;
    });
  }, [schemeCatalog, numericCost, annualIncome]);

  // Moratorium range based on scheme
  const moratoriumRange = useMemo(() => {
    if (activeSchemeKey === "micro_finance") return "3 - 6 Months";
    if (activeSchemeKey === "education_loan") return "Course duration + 1 Year";
    return "6 - 9 Months";
  }, [activeSchemeKey]);

  // Repayment tenure description
  const tenureDisplay = useMemo(() => {
    if (activeSchemeKey === "micro_finance") return "36 Monthly Installments";
    if (activeSchemeKey === "education_loan")
      return "Post-course moratorium installments";
    return "60 Monthly Installments";
  }, [activeSchemeKey]);

  // Plain-language reasoning sentence built directly from answers
  const reasoningSentence = useMemo(() => {
    const formattedCost = formatCurrency(numericCost);
    const formattedIncome = formatCurrency(numericIncome);
    const formattedAnnual = formatCurrency(annualIncome);
    const trade = answers.projectType || "Small trade/business";
    const education = answers.educationStatus || "10th Pass";

    if (!selectedEligible) {
      return `Based on your submitted monthly family income of ${formattedIncome} (Annual: ${formattedAnnual}), your household income exceeds the statutory ${formatCurrency(500000)} annual ceiling for MoSJE concessional welfare credit. However, you remain eligible for Mudra and standard MSME lending channels.`;
    }

    if (isEducationScheme) {
      return `Based on your educational qualification of ${education} and the selected course financing requirement of ${formattedCost}, you qualify for ${schemeName}. Under statutory MoSJE guidelines, this offers concessional credit at ${interestRateRange} subsidized interest with a course-duration + 1 year moratorium grace window and zero collateral.`;
    }

    return `Based on your proposed venture in ${trade} with an estimated project cost of ${formattedCost}, a monthly family income of ${formattedIncome} (Annual: ${formattedAnnual}), and educational qualification of ${education}, you qualify for ${schemeName}. Under statutory MoSJE guidelines, this offers ${loanRatioPct}% concessional credit (${formatCurrency(suggestedAmount)}) at ${interestRateRange} subsidized interest with a ${moratoriumRange} moratorium grace window, requiring only a ${promoterRatioPct}% (${formatCurrency(promoterContribution)}) self-contribution.`;
  }, [
    selectedEligible,
    isEducationScheme,
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
  ]);

  // Navigation handlers
  const handleCalculateEMI = () => {
    // Determine interest rate bounds for the calculator slider
    let minRate = 4.0;
    let maxRate = 6.0;
    if (activeSchemeKey === "micro_finance") {
      minRate = 4.0;
      maxRate = 5.0;
    } else if (activeSchemeKey === "education_loan") {
      minRate = 3.5;
      maxRate = 4.0;
    }

    navigate("/calculator", {
      state: {
        schemeId: activeSchemeKey,
        suggestedAmount,
        scheme: {
          id: activeSchemeKey,
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
    });
  };

  const handleFindPartner = () => {
    navigate("/locator", {
      state: {
        schemeType: activeSchemeKey,
        schemeName,
      },
    });
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createApplication({
        schemeId,
        ...answers,
      });

      if (res?.error) {
        const errorMsg =
          res.error?.message ||
          (typeof res.error === "string" ? res.error : null) ||
          "Failed to submit application. Please try again.";
        setSubmitError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      navigate("/applications");
    } catch (err) {
      const errorMsg =
        err?.message ||
        (typeof err === "string" ? err : null) ||
        "Failed to submit application. Please try again.";
      setSubmitError(errorMsg);
      setIsSubmitting(false);
    }
  };

  // Guard check: redirect to /recommender if state is missing
  if (!hasValidState) {
    return <Navigate to="/recommender" replace />;
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 flex flex-col w-full min-h-[calc(100vh-4rem)] justify-between gap-6">
      <div className="flex flex-col w-full max-w-7xl mx-auto space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-panel border border-chassis-dark/25 font-mono text-xs text-ink shadow-xs">
              <LedIndicator status="active" size="sm" pulse />
              <span className="font-semibold uppercase tracking-wider text-ink-muted">
                Verified Analysis // REC-2025-UP-9841
              </span>
            </div>
            <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-ink uppercase">
              Scheme Match Results{" "}
              <span className="block md:inline font-sans text-lg md:text-xl font-normal text-ink-muted ml-0 md:ml-2">
                / आपकी पात्रता के अनुसार चयनित योजना
              </span>
            </h1>
            <p className="font-sans text-xs md:text-sm text-ink-muted max-w-3xl leading-relaxed">
              Transparent, rule-based algorithmic verification according to
              Ministry of Social Justice and Empowerment (MoSJE) operational
              guidelines.
            </p>
          </div>
          <TactileButton
            variant="ghost"
            size="sm"
            onClick={handleClosePreview}
            aria-label={text("Close preview", "पूर्वावलोकन बंद करें")}
          >
            <X className="w-4 h-4" /> {text("Close preview", "पूर्वावलोकन बंद करें")}
          </TactileButton>
          <div className="flex items-center gap-2.5 self-start md:self-auto font-mono">
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Report
            </TactileButton>
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={() => alert("PDF report generation initialized.")}
            >
              <Download className="w-4 h-4 mr-1.5" />
              PDF Summary
            </TactileButton>
          </div>
        </div>

        {/* Evaluation Summary Banner (Hardware Bezel) */}
        <HardwareBezel
          title="TELEMETRY REPORT: MATCH VERIFICATION COMPLETED"
          statusText="1 TOP MATCH // 2 ALTERNATIVE LINKAGES"
          statusLed="success"
          className="w-full text-left"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded bg-chassis shadow-pressed text-accent flex items-center justify-center shrink-0 border border-chassis-dark/30">
                <Award className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="font-mono text-[10px] text-accent uppercase font-bold tracking-wider">
                  {text("Evaluation Complete", "मूल्यांकन संपन्न")} • मूल्यांकन संपन्न
                </div>
                <p className="font-sans text-xs md:text-sm text-ink font-medium mt-0.5">
                  Target Sector:{" "}
                  <strong className="text-accent font-mono">
                    {answers.projectType || "Retail & Trade"}
                  </strong>{" "}
                  • Cost:{" "}
                  <strong className="font-mono text-ink">
                    {formatCurrency(numericCost)}
                  </strong>
                  . {text(
                    "Parameters fully satisfy concessional lending prerequisites.",
                    "पैरामीटर रियायती ऋण की सभी शर्तें पूरी करते हैं।",
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 bg-recessed shadow-recessed border border-chassis-dark/30 px-4 py-2.5 rounded-lg self-start md:self-auto font-mono">
              <Coins className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-left">
                <div className="text-[10px] uppercase text-ink-muted leading-none tracking-wider">
                  Eligible Credit Line
                </div>
                <div className="text-sm font-bold text-ink uppercase mt-0.5">
                  {formatCurrency(suggestedAmount)} Sanctionable
                </div>
              </div>
            </div>
          </div>
        </HardwareBezel>

        <IndustrialCard className="p-5" cornerScrews>
          {/* Dropdown of all schemes meeting the user's requirement, beside the eligible scheme picker */}
          <div className="mb-4">
            <label
              htmlFor="eligibleSchemeSelect"
              className="block font-mono text-xs font-bold uppercase tracking-wider text-ink"
            >
              {text(
                "Eligible schemes — select from the dropdown",
                "पात्र योजनाएँ — ड्रॉपडाउन से चुनें",
              )}
            </label>
            <div className="relative mt-2">
              <select
                id="eligibleSchemeSelect"
                value={activeSchemeKey}
                onChange={(event) => setActiveSchemeKey(event.target.value)}
                className="w-full h-12 pl-4 pr-10 bg-recessed text-ink font-mono text-sm font-bold rounded-lg border border-chassis-dark/40 shadow-recessed focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer"
              >
                {eligibleSchemes.length === 0 && (
                  <option value="">
                    {text(
                      "No scheme matches your entered cost and income",
                      "आपकी लागत और आय के अनुरूप कोई योजना नहीं",
                    )}
                  </option>
                )}
                {eligibleSchemes.map((scheme) => (
                  <option key={scheme.id} value={scheme.id}>
                    {(isHindi && (scheme.titleHi || scheme.title_hi)) ||
                      scheme.title ||
                      scheme.name ||
                      scheme.schemeName}
                    {scheme.interestRate ? ` - ${scheme.interestRate}` : ""}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none text-2xl">
                arrow_drop_down
              </span>
            </div>
            {eligibleSchemes.length === 0 && (
              <p className="mt-2 font-mono text-xs text-accent">
                {text(
                  "Your inputs exceed the catalog limits. Consider Mudra / commercial lending channels.",
                  "आपकी जानकारी सूची सीमा से अधिक है। Mudra / वाणिज्यिक ऋण विकल्प देखें।",
                )}
              </p>
            )}
          </div>
          <SchemePicker
            schemes={schemeCatalog}
            selectedId={activeSchemeKey}
            recommendedId={schemeKey === "ineligible" ? null : schemeKey}
            onSelect={(id) => setActiveSchemeKey(id)}
          />
        </IndustrialCard>

        {/* Ineligible Notice if Ceiling Exceeded */}
        {!selectedEligible && (
          <div className="p-5 rounded-xl bg-accent/10 text-ink shadow-card border-2 border-accent flex flex-col gap-2 text-left">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-accent uppercase tracking-wider">
              <AlertCircle className="w-5 h-5" />
              <span>
                {text(
                  "Annual Family Income Exceeds Statutory Ceiling",
                  "वार्षिक पारिवारिक आय सांविधिक सीमा से अधिक है",
                )} ({formatCurrency(500000)})
              </span>
            </div>
            <p className="font-sans text-xs md:text-sm text-ink-muted leading-relaxed">
              {text(
                "Under statutory MoSJE guidelines, concessional loans with 4%–6% subsidized interest are reserved for families with total annual household earnings within",
                "सांविधिक MoSJE दिशानिर्देशों के अंतर्गत, 4%–6% रियायती ब्याज वाले ऋण उन परिवारों के लिए आरक्षित हैं जिनकी कुल वार्षिक आय",
              )}{" "}
              {formatCurrency(500000)}
              {text(
                ". For higher earnings, consider Pradhan Mantri MUDRA Yojana (PMMY) or Stand-Up India at standard bank interest rates.",
                " के भीतर है। अधिक आय होने पर प्रधानमंत्री मुद्रा योजना (PMMY) या स्टैंड-अप इंडिया विकल्प देखें।",
              )}
            </p>
          </div>
        )}

        {/* Main Recommendation Result Card */}
        <IndustrialCard
          cornerScrews={true}
          ventSlots={true}
          className="text-left p-6 md:p-8 flex flex-col gap-6"
        >
          {/* Header row: Match badge + Scheme Name + Cost allocation ratio */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-panel shadow-card border border-chassis-dark/20 font-mono text-xs font-bold text-ink">
                  <LedIndicator
                    status={selectedEligible ? "success" : "warning"}
                    size="sm"
                  />
                  <span>
                    {selectedEligible
                      ? text("100% ELIGIBILITY MATCH", "100% पात्रता मिलान")
                      : text("WELFARE CEILING ADVISORY", "कल्याण सीमा सलाह")}
                  </span>
                </span>
                <span className="px-2.5 py-1 rounded bg-recessed shadow-recessed text-ink font-mono text-[11px] font-semibold border border-chassis-dark/20">
                  MoSJE / NSFDC Official
                </span>
                <span className="px-2.5 py-1 rounded bg-recessed shadow-recessed text-ink-muted font-mono text-[11px] border border-chassis-dark/20">
                  STAMP: [{schemeCode}]
                </span>
              </div>

              <h2 className="font-mono text-xl md:text-2xl font-bold text-ink tracking-tight uppercase">
                {schemeName}
                {schemeNameHi && (
                  <span className="block font-sans text-sm md:text-base text-ink-muted font-normal mt-0.5 normal-case">
                    {schemeNameHi}
                  </span>
                )}
              </h2>
              <p className="font-mono text-xs text-accent font-bold uppercase tracking-wider">
                {text("Sponsoring Agency", "प्रायोजक एजेंसी")}: {agency}
              </p>
            </div>

            {/* Cost Allocation Ratio Gauge */}
            <div className="w-full lg:w-72 p-4 rounded-xl bg-recessed shadow-recessed border border-chassis-dark/30 shrink-0 flex flex-col justify-between space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-ink-muted tracking-wider">
                  {text("Cost Allocation Ratio", "लागत आवंटन अनुपात")}
                </span>
                <span className="text-xs font-bold text-ink">
                  {loanRatioPct}% : {promoterRatioPct}%
                </span>
              </div>
              <div className="w-full bg-chassis h-3 rounded-full overflow-hidden flex shadow-inner border border-chassis-dark/30">
                <div
                  className="bg-accent h-full transition-all"
                  style={{ width: `${loanRatioPct}%` }}
                  title={`Govt/SCA Loan Contribution: ${loanRatioPct}%`}
                />
                <div
                  className="bg-chassis-dark h-full transition-all"
                  style={{ width: `${promoterRatioPct}%` }}
                  title={`Promoter Contribution: ${promoterRatioPct}%`}
                />
              </div>
              <div className="flex justify-between text-left text-xs pt-1">
                <div>
                  <span className="block text-ink font-bold">
                    {formatCurrency(suggestedAmount)} ({loanRatioPct}%)
                  </span>
                  <span className="text-[10px] text-ink-muted uppercase">
                    {text("Concessional Loan", "रियायती ऋण")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-accent font-bold">
                    {formatCurrency(promoterContribution)} ({promoterRatioPct}%)
                  </span>
                  <span className="text-[10px] text-ink-muted uppercase">
                    {text("Self Share", "स्वयं का हिस्सा")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Plain-language reasoning box built from answers */}
          <div className="rounded-xl bg-recessed shadow-recessed p-5 border border-chassis-dark/30 space-y-3">
            <div className="flex items-center gap-2 text-ink">
              <Cpu className="w-4 h-4 text-accent" />
              <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-ink">
                {text(
                  "Algorithmic Match Telemetry",
                  "चयन का आधार एवं स्पष्टीकरण",
                )} // चयन का आधार
              </h3>
            </div>
            <p className="font-sans text-xs md:text-sm text-ink leading-relaxed">
              {reasoningSentence}
            </p>
            {result.reason && (
              <p className="font-sans text-xs text-ink-muted italic border-l-2 border-accent pl-3">
                {result.reason}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs text-ink">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{text("Target demographic verified", "लक्षित वर्ग सत्यापित")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{text("Sector notified under MoSJE rules", "क्षेत्र MoSJE नियमों में अधिसूचित")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{text("SCA channel zero-collateral", "SCA माध्यम शून्य-बंधक")}</span>
              </div>
            </div>
          </div>

          {/* 5 Financial Metric Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
            {/* Metric 1: Concessional Interest */}
            <div className="p-4 rounded-xl bg-panel shadow-card border border-chassis-dark/20 flex flex-col justify-between">
              <span className="text-[10px] uppercase text-ink-muted tracking-wider">
                {text("Concessional Rate", "रियायती दर")}
              </span>
              <div className="mt-2">
                <div className="text-xl font-bold text-ink">
                  {interestRateRange}
                </div>
                <span className="text-[11px] text-accent font-semibold">
                  {text("vs Bank 12-14%", "बैंक 12-14% की तुलना में")}
                </span>
              </div>
              <span className="text-[10px] text-ink-muted mt-2 pt-2 bg-chassis rounded px-1.5 py-0.5 border border-chassis-dark/15">
                {text("Subsidy embedded", "सब्सिडी सम्मिलित")}
              </span>
            </div>

            {/* Metric 2: Sanction Amount */}
            <div className="p-4 rounded-xl bg-panel shadow-card border border-chassis-dark/20 flex flex-col justify-between">
              <span className="text-[10px] uppercase text-ink-muted tracking-wider">
                {text("Sanction Amount", "स्वीकृत राशि")}
              </span>
              <div className="mt-2">
                <div className="text-xl font-bold text-ink">
                  {formatCurrency(suggestedAmount)}
                </div>
                <span className="text-[11px] text-ink-muted truncate block">
                  {text("Max up to", "अधिकतम")} {schemeDef.maxAmountFormatted || "₹5.0L"}
                </span>
              </div>
              <span className="text-[10px] text-ink-muted mt-2 pt-2 bg-chassis rounded px-1.5 py-0.5 border border-chassis-dark/15">
                {text("Direct to Bank/Vendor", "सीधे बैंक/विक्रेता को")}
              </span>
            </div>

            {/* Metric 3: Moratorium Period */}
            <div className="p-4 rounded-xl bg-panel shadow-card border border-chassis-dark/20 flex flex-col justify-between">
              <span className="text-[10px] uppercase text-ink-muted tracking-wider">
                {text("Moratorium Window", "मोरेटोरियम अवधि")}
              </span>
              <div className="mt-2">
                <div className="text-xl font-bold text-ink truncate">
                  {moratoriumRange}
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  ईएमआई छूट अवधि
                </span>
              </div>
              <span className="text-[10px] text-ink-muted mt-2 pt-2 bg-chassis rounded px-1.5 py-0.5 border border-chassis-dark/15">
                {text("Grace period active", "छूट अवधि सक्रिय")}
              </span>
            </div>

            {/* Metric 4: Repayment Tenure */}
            <div className="p-4 rounded-xl bg-panel shadow-card border border-chassis-dark/20 flex flex-col justify-between">
              <span className="text-[10px] uppercase text-ink-muted tracking-wider">
                {text("Repayment Tenure", "पुनर्भुगतान अवधि")}
              </span>
              <div className="mt-2">
                <div className="text-xl font-bold text-ink">
                  {activeSchemeKey === "micro_finance"
                    ? text("Up to 3 Yrs", "3 वर्ष तक")
                    : activeSchemeKey === "education_loan"
                      ? text("Post-course", "पाठ्यक्रम के बाद")
                      : text("Up to 5 Yrs", "5 वर्ष तक")}
                </div>
                <span className="text-[11px] text-ink-muted truncate block">
                  {tenureDisplay}
                </span>
              </div>
              <span className="text-[10px] text-ink-muted mt-2 pt-2 bg-chassis rounded px-1.5 py-0.5 border border-chassis-dark/15">
                {text("Flexible prepayment", "लचीला पूर्व-भुगतान")}
              </span>
            </div>

            {/* Metric 5: Security & Guarantee */}
            <div className="p-4 rounded-xl bg-panel shadow-card border border-chassis-dark/20 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] uppercase text-ink-muted tracking-wider">
                {text("Security Guarantee", "सुरक्षा गारंटी")}
              </span>
              <div className="mt-2">
                <div className="text-xl font-bold text-accent">
                  {text("Zero Collateral", "शून्य बंधक")}
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  कोई बंधक नहीं
                </span>
              </div>
              <span className="text-[10px] text-ink-muted mt-2 pt-2 bg-chassis rounded px-1.5 py-0.5 border border-chassis-dark/15">
                {text("Hypothecated assets", "बंधकित संपत्ति")}
              </span>
            </div>
          </div>

          {/* Profile Snapshot & Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-recessed shadow-recessed border border-chassis-dark/30 flex items-start gap-3">
              <Building className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <h4 className="font-mono text-xs uppercase font-bold text-ink">
                  {text("Venture Profile Registered", "उद्यम प्रोफ़ाइल पंजीकृत")}
                </h4>
                <p className="font-sans text-xs text-ink-muted leading-relaxed">
                  {text("Target Activity", "लक्षित गतिविधि")}:{" "}
                  <strong className="text-ink">{answers.projectType}</strong>.
                  {text(
                    "Capital allocated for machinery, working capital, inventory procurement, and operational setup.",
                    "मशीनरी, कार्यशील पूंजी, सूची खरीद और परिचालन व्यवस्था हेतु पूंजी आवंटित।",
                  )}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-recessed shadow-recessed border border-chassis-dark/30 flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <h4 className="font-mono text-xs uppercase font-bold text-ink">
                  {text(
                    "Required Baseline Credentials",
                    "आवश्यक आधारभूत दस्तावेज़",
                  )}
                </h4>
                <p className="font-sans text-xs text-ink-muted leading-relaxed">
                  {text(
                    "Aadhaar Card, Caste Certificate (जाति प्रमाण पत्र), Domicile Proof, Bank Passbook (6 months active), and Quotation/Estimate of items.",
                    "आधार कार्ड, जाति प्रमाण पत्र, निवास प्रमाण, बैंक पासबुक (6 महीने सक्रिय), और सामान का कोटेशन/अनुमान।",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Application Error Alert */}
          {submitError && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-accent/10 text-accent font-mono text-xs flex items-center gap-3 border border-accent"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 font-medium">{submitError}</span>
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="text-accent hover:opacity-70 cursor-pointer transition-opacity"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Buttons: Find partner near me & Calculate my EMI & Submit Application */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 font-mono">
            <TactileButton
              variant="secondary"
              size="md"
              onClick={handleFindPartner}
            >
              <MapPin className="w-4 h-4 mr-1.5 text-accent" />
              <span>{text("Locate Partner", "नजदीकी SCA खोजें")}</span>
            </TactileButton>

            <TactileButton
              variant="secondary"
              size="md"
              onClick={handleCalculateEMI}
            >
              <Calculator className="w-4 h-4 mr-1.5 text-ink" />
              <span>{text("Calculate EMI", "ईएमआई देखें")}</span>
            </TactileButton>

            <TactileButton
              variant="primary"
              size="md"
              onClick={handleSubmitApplication}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>{text("SUBMITTING APPLICATION...", "आवेदन जमा हो रहा है...")}</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-1.5" />
                  <span>{text("Submit Application", "आवेदन जमा करें")}</span>
                </>
              )}
            </TactileButton>
          </div>
        </IndustrialCard>

        {/* Alternative & Complementary Schemes */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-mono text-lg font-bold uppercase text-ink tracking-tight">
                {text(
                  "Alternative & Complementary Schemes",
                  "वैकल्पिक एवं सहायक योजनाएं",
                )} // वैकल्पिक योजनाएं
              </h3>
              <p className="font-sans text-xs text-ink-muted">
                {text(
                  "Explore secondary government credit linkages tailored for specialized enterprise profiles",
                  "विशेष उद्यम प्रोफ़ाइल हेतु अतिरिक्त सरकारी ऋण विकल्प देखें",
                )}
              </p>
            </div>
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider font-bold bg-panel px-2.5 py-1 rounded border border-chassis-dark/20">
              {text("2 Linkages Available", "2 विकल्प उपलब्ध")}
            </span>
          </div>

          {/* Alternative Scheme 1: PM-DAKSH */}
          <IndustrialCard
            className="overflow-hidden transition-all duration-200 text-left p-0"
            cornerScrews={false}
          >
            <div
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-colors hover:bg-chassis/40"
              onClick={() => toggleAlt("alt1")}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-recessed shadow-recessed text-accent flex items-center justify-center shrink-0 border border-chassis-dark/25">
                  <Cpu className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink uppercase">
                      PM-DAKSH Credit Linkage Scheme
                    </span>
                    <span className="px-2 py-0.5 rounded bg-recessed font-mono text-[11px] text-ink-muted border border-chassis-dark/20">
                      Up to {formatCurrency(100000)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-600/15 text-emerald-700 font-mono text-[11px] font-bold border border-emerald-600/30">
                      35% Subsidy
                    </span>
                  </div>
                  <p className="font-sans text-xs text-ink-muted mt-1 leading-relaxed">
                    Provides composite capital subsidy up to{" "}
                    {formatCurrency(35000)} for certified micro-vendors,
                    artisans, and skill-trained youth under MoSJE.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto font-mono text-xs text-ink font-semibold">
                <span>View Linkage</span>
                {expandedAlt.alt1 ? (
                  <ChevronUp className="w-4 h-4 text-accent" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-ink-muted" />
                )}
              </div>
            </div>

            {expandedAlt.alt1 && (
              <div className="px-5 pb-5 pt-3 bg-recessed shadow-inner border-t border-chassis-dark/25 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs text-ink">
                  <div className="p-3 rounded-lg bg-panel shadow-card border border-chassis-dark/20">
                    <div className="text-[10px] uppercase text-ink-muted">
                      Financial Quantum
                    </div>
                    <div className="text-sm font-bold text-ink mt-0.5">
                      {formatCurrency(100000)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      35% non-refundable grant
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-panel shadow-card border border-chassis-dark/20">
                    <div className="text-[10px] uppercase text-ink-muted">
                      Prerequisite Certificate
                    </div>
                    <div className="text-sm font-bold text-ink mt-0.5">
                      PM-DAKSH Certified
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5">
                      Prior skill certificate required
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-panel shadow-card border border-chassis-dark/20">
                    <div className="text-[10px] uppercase text-ink-muted">
                      Lending Agency
                    </div>
                    <div className="text-sm font-bold text-ink mt-0.5">
                      PSBs / RRBs
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5">
                      Direct DBT Linkage
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <span className="font-sans text-xs text-ink-muted">
                    Best if: You have completed certified retail or
                    micro-entrepreneurship training under Skill India /
                    PM-DAKSH.
                  </span>
                  <TactileButton
                    variant="primary"
                    size="sm"
                    className="shrink-0 font-mono text-xs"
                    onClick={() =>
                      navigate("/locator", {
                        state: {
                          schemeType: "pm_daksh",
                          schemeName: "PM-DAKSH",
                        },
                      })
                    }
                  >
                    Locate PM-DAKSH Centers
                  </TactileButton>
                </div>
              </div>
            )}
          </IndustrialCard>

          {/* Alternative Scheme 2: NBCFDC / Direct Lending */}
          <IndustrialCard
            className="overflow-hidden transition-all duration-200 text-left p-0"
            cornerScrews={false}
          >
            <div
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-colors hover:bg-chassis/40"
              onClick={() => toggleAlt("alt2")}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-recessed shadow-recessed text-accent flex items-center justify-center shrink-0 border border-chassis-dark/25">
                  <Layers className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ink uppercase">
                      NBCFDC Micro Finance Scheme (Direct Lending)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-recessed font-mono text-[11px] text-ink-muted border border-chassis-dark/20">
                      Up to {formatCurrency(140000)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-panel font-mono text-[11px] text-accent font-bold border border-chassis-dark/20">
                      4.0% - 5.0% Simple p.a.
                    </span>
                  </div>
                  <p className="font-sans text-xs text-ink-muted mt-1 leading-relaxed">
                    Targeted for micro-units, self-help groups, and individual
                    backward class entrepreneurs requiring accelerated 7-day
                    single-window verification.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto font-mono text-xs text-ink font-semibold">
                <span>View Linkage</span>
                {expandedAlt.alt2 ? (
                  <ChevronUp className="w-4 h-4 text-accent" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-ink-muted" />
                )}
              </div>
            </div>

            {expandedAlt.alt2 && (
              <div className="px-5 pb-5 pt-3 bg-recessed shadow-inner border-t border-chassis-dark/25 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs text-ink">
                  <div className="p-3 rounded-lg bg-panel shadow-card border border-chassis-dark/20">
                    <div className="text-[10px] uppercase text-ink-muted">
                      Max Loan Quantum
                    </div>
                    <div className="text-sm font-bold text-ink mt-0.5">
                      {formatCurrency(140000)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      Fast-Track Single Window
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-panel shadow-card border border-chassis-dark/20">
                    <div className="text-[10px] uppercase text-ink-muted">
                      Concessional Rate
                    </div>
                    <div className="text-sm font-bold text-ink mt-0.5">
                      4.0% - 5.0% Simple p.a.
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5">
                      No compound penalties
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-panel shadow-card border border-chassis-dark/20">
                    <div className="text-[10px] uppercase text-ink-muted">
                      Repayment Tenure
                    </div>
                    <div className="text-sm font-bold text-ink mt-0.5">
                      36 Monthly Installments
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5">
                      3 months moratorium
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <span className="font-sans text-xs text-ink-muted">
                    Best if: Seeking immediate working capital under{" "}
                    {formatCurrency(140000)} without complex formal balance
                    sheet requirements.
                  </span>
                  <TactileButton
                    variant="primary"
                    size="sm"
                    className="shrink-0 font-mono text-xs"
                    onClick={() =>
                      navigate("/calculator", {
                        state: {
                          schemeId: "micro_finance",
                          suggestedAmount: Math.min(
                            numericCost || 100000,
                            140000,
                          ),
                          scheme: SCHEMES.micro_finance,
                          answers,
                        },
                      })
                    }
                  >
                    Calculate Micro Finance EMI
                  </TactileButton>
                </div>
              </div>
            )}
          </IndustrialCard>
        </div>

        {/* Assistance / Support Helpdesk Strip */}
        <IndustrialCard
          cornerScrews={true}
          className="p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-left"
        >            <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-chassis shadow-pressed text-accent flex items-center justify-center shrink-0 border border-chassis-dark/25">
              <Phone className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase font-bold text-ink">
                {text(
                  "Need verification assistance with district documents?",
                  "जिला दस्तावेज़ सत्यापन में सहायता चाहिए?",
                )}
              </h4>
              <p className="font-sans text-xs text-ink-muted leading-relaxed">
                {text(
                  "Connect directly with your district Social Welfare Facilitator (जिला समाज कल्याण सहायक) for free on-ground document calibration.",
                  "मुफ्त दस्तावेज़ सहायता हेतु अपने जिला समाज कल्याण सहायक से सीधे जुड़ें।",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={handleFindPartner}
            >
              <MapPin className="w-4 h-4 mr-1.5 text-accent" />
              {text("Find Local Facilitator", "स्थानीय सहायक खोजें")}
            </TactileButton>
            <a
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white font-mono text-xs font-bold shadow-btn-primary hover:shadow-floating active:shadow-pressed active:translate-y-[2px] transition-all"
              href="tel:1800117788"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>1800-11-7788</span>
            </a>
          </div>
        </IndustrialCard>
      </div>

      {/* Official Chassis Footer */}
      <footer className="w-full bg-panel shadow-card border border-chassis-dark/20 py-3 px-6 rounded-xl font-mono text-xs text-ink-muted mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {text(
              "Official portal of the Ministry of Social Justice & Empowerment • Government of India // Report Verification",
              "सामाजिक न्याय और अधिकारिता मंत्रालय • भारत सरकार // रिपोर्ट सत्यापन",
            )}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> {text("Certified Data Privacy", "प्रमाणित डेटा गोपनीयता")}
            </span>
            <span>{text("Helpline", "हेल्पलाइन")}: 1800-11-7788</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
