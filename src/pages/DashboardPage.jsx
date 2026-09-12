import { useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useApplications } from "../hooks/useApplications";
import { formatCurrency } from "../lib/formatCurrency";
import IndustrialCard from "../components/ui/IndustrialCard";
import TactileButton from "../components/ui/TactileButton";
import LedIndicator from "../components/ui/LedIndicator";
import {
  ShieldCheck,
  Download,
  Sparkles,
  Calculator,
  MapPin,
  Clock,
  ArrowRight,
  FileCheck,
  AlertCircle,
  Eye,
  Check,
  Building,
} from "lucide-react";

export default function DashboardPage() {
  const { i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith("hi");
  const text = (english, hindi) => (isHindi ? hindi : english);
  const { user, profile, updateProfile } = useAuth();
  const [readinessError, setReadinessError] = useState("");
  const [readinessType, setReadinessType] = useState("");
  const readinessFileRef = useRef(null);
  const { applications, loading } = useApplications(user?.id);

  const mostRecentApp =
    applications && applications.length > 0 ? applications[0] : null;

  // Determine application stage details
  const appStatus = (mostRecentApp?.status || "submitted").toLowerCase();
  const isDisbursed = appStatus === "disbursed" || appStatus === "completed";
  const isApproved = appStatus === "approved" || appStatus === "sanctioned";
  const isRouted = appStatus === "routed";

  let stageBadgeText = "Stage 1 of 4: Submitted";
  let currentStep = 1;

  if (isDisbursed) {
    stageBadgeText = "Stage 4 of 4: Disbursed";
    currentStep = 4;
  } else if (isApproved) {
    stageBadgeText = "Stage 3 of 4: Credit Sanctioned";
    currentStep = 3;
  } else if (isRouted) {
    stageBadgeText = "Stage 2 of 4: In Scrutiny";
    currentStep = 2;
  }

  const appSchemeName =
    mostRecentApp?.scheme_name ||
    mostRecentApp?.schemes?.name ||
    mostRecentApp?.schemes?.title ||
    "Concessional Credit Scheme (MoSJE)";

  const appPartnerName =
    mostRecentApp?.partner_name ||
    mostRecentApp?.channel_partners?.name ||
    "State Channelising Agency (SCA)";

  const submissionDateFormatted = mostRecentApp?.created_at
    ? new Date(mostRecentApp.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recent Submission";

  const formattedRef = mostRecentApp?.id
    ? String(mostRecentApp.id).startsWith("YS-")
      ? mostRecentApp.id
      : `YS-${String(mostRecentApp.id).slice(0, 8).toUpperCase()}`
    : "Not Applied";

  const handleReadinessUpload = (event) => {
    const file = event.target.files?.[0];
    // Reset the input so selecting the same file again after a failed
    // attempt still fires a change event.
    if (readinessFileRef.current) readinessFileRef.current.value = "";
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setReadinessError(
        text(
          "Attach a PDF, JPG, or PNG file up to 10 MB.",
          "10 MB तक PDF, JPG या PNG फ़ाइल संलग्न करें।",
        ),
      );
      return;
    }
    const category = readinessType;
    const categoryLabels = {
      identity: ["Identity proof", "पहचान प्रमाण"],
      caste: ["Caste certificate", "जाति प्रमाण पत्र"],
      income: ["Income certificate", "आय प्रमाण पत्र"],
      domicile: ["Domicile certificate", "निवास प्रमाण पत्र"],
      bank: ["Bank proof", "बैंक प्रमाण"],
      quotation: ["Project quotation", "परियोजना कोटेशन"],
    };
    if (!categoryLabels[category]) {
      setReadinessError(
        text(
          "Choose one of the listed document categories.",
          "सूचीबद्ध दस्तावेज़ श्रेणी चुनें।",
        ),
      );
      return;
    }
    if (
      (profile?.documents || []).some(
        (document) => document.category === category,
      )
    ) {
      setReadinessError(
        text(
          "That document category is already attached.",
          "यह दस्तावेज़ श्रेणी पहले से संलग्न है।",
        ),
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      await updateProfile({
        documents: [
          ...(profile?.documents || []),
          {
            name: file.name,
            type: file.type,
            size: file.size,
            category,
            categoryLabel: `${categoryLabels[category][0]} / ${categoryLabels[category][1]}`,
            data: reader.result,
            status: "pending",
          },
        ],
        verification_status: "pending_review",
      });
      setReadinessError("");
      setReadinessType("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReadinessDocument = async (category) => {
    const remaining = (profile?.documents || []).filter(
      (document) => document.category !== category,
    );
    await updateProfile({
      documents: remaining,
      verification_status: remaining.length ? "pending_review" : "unverified",
    });
    setReadinessError("");
  };

  const handleDownloadAcknowledgment = () => {
    const refId = mostRecentApp ? formattedRef : "YS-NEW-CITIZEN";
    const lines = [
      "YOJANASETU - OFFICIAL ACKNOWLEDGMENT SLIP",
      "\u0928\u093e\u0932\u0902\u0935\u0940 \u092a\u093e\u0935\u0924\u0940 \u092a\u0930\u0930\u094d\u0932\u0947\u0916",
      "====================================================",
      `Reference: ${refId}`,
      `Name: ${profile?.name || "Beneficiary"}`,
      `Email: ${user?.email || "-"}`,
      `Scheme: ${appSchemeName}`,
      `Partner: ${appPartnerName}`,
      `Submitted: ${submissionDateFormatted}`,
      `Status: ${stageBadgeText}`,
      `Documents attached: ${(profile?.documents || []).length}`,
      "====================================================",
      "Ministry of Social Justice & Empowerment, Government of India",
      "Helpline: 1800-11-7788",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `YojanaSetu-Acknowledgment-${refId}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 flex flex-col w-full gap-6">
      {/* Verified Beneficiary Profile Banner - Dark Technical Command Panel */}
      <div className="relative overflow-hidden rounded-2xl bg-[#112250] text-[#f5f0e9] p-6 sm:p-8 shadow-floating border border-white/10 corner-screws">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-accent font-mono text-xs font-bold uppercase tracking-widest mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {text(
                  profile?.verification_status === "verified"
                    ? "Verified Beneficiary Profile"
                    : "Beneficiary Profile",
                  profile?.verification_status === "verified"
                    ? "प्रमाणित लाभार्थी प्रोफ़ाइल"
                    : "लाभार्थी प्रोफ़ाइल",
                )}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white embossed-text-dark">
              Namaste {profile?.name || "Beneficiary"} / नमस्ते{" "}
              {profile?.name || "लाभार्थी"}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-white/80 font-mono text-xs">
              <span>
                REF:{" "}
                <strong className="text-white tracking-wider">
                  {mostRecentApp ? formattedRef : "YS-NEW-CITIZEN"}
                </strong>
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-accent" />
              <span>
                CATEGORY:{" "}
                <strong className="text-white">
                  {profile?.caste_category ||
                    profile?.category ||
                    text("Not provided", "उपलब्ध नहीं")}
                </strong>
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-accent" />
              <span>
                LOCATION:{" "}
                <strong className="text-white">
                  {profile?.state || text("Not provided", "उपलब्ध नहीं")}
                </strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-center">
            <TactileButton
              variant="secondary"
              size="md"
              icon={Download}
              onClick={handleDownloadAcknowledgment}
            >
              {text("Download Acknowledgment", "पावती डाउनलोड करें")}
            </TactileButton>
          </div>
        </div>
      </div>

      {/* Dynamic Application Status Pipeline */}
      {loading ? (
        <IndustrialCard className="p-6 animate-pulse" cornerScrews ventSlots>
          <div className="h-6 w-48 bg-industrial-border-shadow/40 rounded mb-4" />
          <div className="h-20 bg-recessed rounded-xl" />
        </IndustrialCard>
      ) : mostRecentApp ? (
        <IndustrialCard className="p-6 sm:p-8" cornerScrews ventSlots>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4 border-b border-industrial-border-shadow/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-chassis shadow-recessed flex items-center justify-center text-accent">
                <Building className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase tracking-wider text-ink-muted font-bold">
                  {text("Active Application Status", "सक्रिय आवेदन स्थिति")} • #
                  {formattedRef}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight embossed-text">
                  {appSchemeName}
                </h2>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-chassis shadow-recessed self-start sm:self-auto border border-white/50">
              <LedIndicator color="orange" label={stageBadgeText} size="sm" />
            </div>
          </div>

          {/* Mechanical Pipeline with Cylindrical Conduit Pipe */}
          <div className="py-8 my-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Conduit Pipe (Desktop only) */}
              <div className="hidden md:block absolute left-8 top-5 right-8 conduit-pipe -z-0" />

              {/* Step 1 */}
              <div className="flex flex-col relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.7)] flex items-center justify-center font-bold text-sm border-2 border-white">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-ink">
                    {text("1. Submitted", "1. जमा किया गया")}
                  </span>
                </div>
                <p className="font-mono text-xs text-ink-muted pl-13 md:pl-0">
                  {submissionDateFormatted} • Digital
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm border-2 border-white ${
                      currentStep > 2
                        ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                        : currentStep === 2
                          ? "bg-accent text-ink shadow-[0_0_12px_#e0c58f]"
                          : "bg-recessed text-ink-muted shadow-recessed"
                    }`}
                  >
                    {currentStep > 2 ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>2</span>
                    )}
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      currentStep === 2
                        ? "text-accent"
                        : currentStep > 2
                          ? "text-ink"
                          : "text-ink-muted"
                    }`}
                  >
                    {text("2. Verification", "2. सत्यापन")}
                  </span>
                </div>
                <p className="font-mono text-xs text-ink-muted pl-13 md:pl-0">
                  {currentStep >= 2
                    ? `Active at ${appPartnerName}`
                    : "Pending Routing"}
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm border-2 border-white ${
                      currentStep > 3
                        ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                        : currentStep === 3
                          ? "bg-accent text-ink shadow-[0_0_12px_#e0c58f]"
                          : "bg-recessed text-ink-muted shadow-recessed"
                    }`}
                  >
                    {currentStep > 3 ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>3</span>
                    )}
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      currentStep === 3
                        ? "text-accent"
                        : currentStep > 3
                          ? "text-ink"
                          : "text-ink-muted"
                    }`}
                  >
                    {text("3. Partner Sanction", "3. साझेदार स्वीकृति")}
                  </span>
                </div>
                <p className="font-mono text-xs text-ink-muted pl-13 md:pl-0">
                  {currentStep >= 3
                    ? "State Committee"
                    : "Post-Verification Review"}
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm border-2 border-white ${
                      currentStep === 4
                        ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                        : "bg-recessed text-ink-muted shadow-recessed"
                    }`}
                  >
                    {currentStep === 4 ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>4</span>
                    )}
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      currentStep === 4 ? "text-emerald-600" : "text-ink-muted"
                    }`}
                  >
                    {text("4. Disbursement", "4. राशि वितरण")}
                  </span>
                </div>
                <p className="font-mono text-xs text-ink-muted pl-13 md:pl-0">
                  Direct Benefit Transfer
                </p>
              </div>
            </div>
          </div>

          {/* SLA Tracking Bar */}
          <div className="p-4 rounded-xl bg-panel shadow-recessed flex flex-col md:flex-row md:items-center justify-between gap-4 border border-industrial-border-shadow/20">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-sm text-ink">
                  {currentStep >= 2
                    ? text(
                        `In Processing at ${appPartnerName}`,
                        `${appPartnerName} में प्रक्रिया जारी`,
                      )
                    : text(
                        "Digital Application Received on MoSJE Portal",
                        "MoSJE पोर्टल पर डिजिटल आवेदन प्राप्त",
                      )}
                </span>
                <span className="font-mono text-xs text-ink-muted">
                  {currentStep >= 2
                    ? "Nodal agency SLA active. Expected review within standard turnaround window."
                    : "File queued for initial screening and channel partner allocation."}
                </span>
              </div>
            </div>
            <NavLink to="/applications" className="shrink-0">
              <TactileButton variant="secondary" size="sm" iconRight={Eye}>
                {text("View All Applications", "सभी आवेदन देखें")}
              </TactileButton>
            </NavLink>
          </div>
        </IndustrialCard>
      ) : (
        /* Empty State */
        <IndustrialCard
          className="p-8 sm:p-12 text-center flex flex-col items-center"
          cornerScrews
        >
          <div className="w-16 h-16 rounded-2xl bg-chassis shadow-recessed text-accent flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-ink mb-2 embossed-text">
            No Active Applications Found / कोई सक्रिय आवेदन नहीं
          </h2>
          <p className="font-mono text-xs text-ink-muted max-w-lg mb-6 leading-relaxed">
            You have not submitted any scheme applications yet. Discover
            eligible central schemes, subsidized interest rates, and capital
            grants with our 2-minute AI Recommender.
          </p>
          <NavLink to="/recommender">
            <TactileButton variant="primary" size="lg" iconRight={ArrowRight}>
              Start Scheme Recommender (योजना सिफारिश शुरू करें)
            </TactileButton>
          </NavLink>
        </IndustrialCard>
      )}

      {/* Quick-Launch Financial Tools */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink uppercase tracking-tight embossed-text">
              {text("Quick-Launch Financial Tools", "त्वरित वित्तीय सेवाएँ")}
            </h2>
            <p className="font-mono text-xs text-ink-muted">
              {text(
                "Access self-service assistance, compute subsidies, and identify physical desks",
                "स्वयं सहायता लें, सब्सिडी की गणना करें और नजदीकी केंद्र खोजें",
              )}
            </p>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] font-bold text-accent uppercase tracking-widest">
            OPERATIONAL TOOLS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Scheme Recommender */}
          <IndustrialCard
            className="p-6 flex flex-col justify-between group"
            cornerScrews
            ventSlots
            interactive
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-chassis shadow-recessed text-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-ink mb-1">
                {text("Scheme Recommender", "योजना सिफारिश")}
              </h3>
              <p className="font-mono text-[10px] text-accent font-bold uppercase tracking-wider mb-2">
                योजना सिफारिश टूल
              </p>
              <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                {text(
                  "Find eligible schemes based on your project cost, trade, and family income in under 2 minutes with zero paperwork.",
                  "बिना कागजी कार्रवाई के दो मिनट में परियोजना लागत, व्यापार और पारिवारिक आय के आधार पर पात्र योजनाएँ खोजें।",
                )}
              </p>
            </div>
            <NavLink to="/recommender" className="w-full">
              <TactileButton
                variant="primary"
                size="md"
                className="w-full"
                iconRight={ArrowRight}
              >
                {text("Find Matching Schemes", "मिलान वाली योजनाएँ खोजें")}
              </TactileButton>
            </NavLink>
          </IndustrialCard>

          {/* Card 2: EMI Calculator */}
          <IndustrialCard
            className="p-6 flex flex-col justify-between group"
            cornerScrews
            ventSlots
            interactive
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-chassis shadow-recessed text-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-ink mb-1">
                {text("EMI Calculator", "ईएमआई कैलकुलेटर")}
              </h3>
              <p className="font-mono text-[10px] text-accent font-bold uppercase tracking-wider mb-2">
                ईएमआई कैलकुलेटर
              </p>
              <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                {text(
                  "Plan your monthly repayments with subsidized interest rates (4%-7%) and custom moratorium grace periods.",
                  "रियायती ब्याज दरों (4%-7%) और मोरेटोरियम अवधि के साथ मासिक भुगतान की योजना बनाएं।",
                )}
              </p>
            </div>
            <NavLink to="/calculator" className="w-full">
              <TactileButton
                variant="secondary"
                size="md"
                className="w-full"
                iconRight={ArrowRight}
              >
                {text("Calculate Repayment EMI", "भुगतान ईएमआई की गणना करें")}
              </TactileButton>
            </NavLink>
          </IndustrialCard>

          {/* Card 3: Channel Partner Locator */}
          <IndustrialCard
            className="p-6 flex flex-col justify-between group"
            cornerScrews
            ventSlots
            interactive
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-chassis shadow-recessed text-accent flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-ink mb-1">
                {text("Channel Partner Locator", "साझेदार केंद्र खोजें")}
              </h3>
              <p className="font-mono text-[10px] text-accent font-bold uppercase tracking-wider mb-2">
                पार्टनर बैंक खोजें
              </p>
              <p className="text-xs text-ink-muted mb-6 leading-relaxed">
                {text(
                  "Locate active bank branches and SCA verification counters near you accepting direct documents.",
                  "आपके पास सीधे दस्तावेज़ स्वीकार करने वाली सक्रिय बैंक शाखाएँ और SCA सत्यापन केंद्र खोजें।",
                )}
              </p>
            </div>
            <NavLink to="/locator" className="w-full">
              <TactileButton
                variant="secondary"
                size="md"
                className="w-full"
                iconRight={ArrowRight}
              >
                {text("View Nearby Partners", "नजदीकी साझेदार देखें")}
              </TactileButton>
            </NavLink>
          </IndustrialCard>
        </div>
      </div>

      {/* Understanding Your Entitlement - Sovereign Stamp Panel */}
      <div className="relative rounded-xl bg-panel p-6 shadow-recessed border border-white/60">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-chassis shadow-card text-accent flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm text-ink">
                Understanding Your Entitlement (अधिकारिता स्पष्टीकरण)
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                MoSJE Sovereign Backed
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Under MoSJE & NSFDC guidelines, concessional credit provides up to{" "}
              <strong className="text-ink">90% project cost</strong> with zero
              collateral for enterprise loans up to{" "}
              <strong className="text-ink">{formatCurrency(500000)}</strong>.
              Capital subsidies are directly credited via DBT to protect you
              from predatory microfinance debt.
            </p>
          </div>
        </div>
      </div>

      {/* Document Readiness Checklist & Recent Agency Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <IndustrialCard className="p-6" cornerScrews>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-industrial-border-shadow/20">
              <h2 className="font-bold text-sm text-ink uppercase tracking-tight flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-accent" />
                <span>{text("Document Readiness Checklist", "दस्तावेज़ तैयारी सूची")}</span>
              </h2>
              <span className="font-mono text-xs text-ink-muted font-bold">
                {profile?.documents?.length || 0} {text("attached", "संलग्न")}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {(profile?.documents || []).length === 0 ? (
                <p className="p-3 rounded-lg bg-panel shadow-recessed font-mono text-xs text-ink-muted">
                  {text(
                    "No documents attached yet.",
                    "अभी कोई दस्तावेज़ संलग्न नहीं है।",
                  )}
                </p>
              ) : (
                profile.documents.map((document, index) => (
                  <div
                    key={`${document.name}-${index}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-panel shadow-recessed font-mono text-xs"
                  >
                    <span className="truncate">{document.categoryLabel || document.name}</span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="text-accent uppercase">
                        {document.status === "pending"
                          ? text("Pending review", "समीक्षा लंबित")
                          : document.status}
                      </span>
                      <button
                        type="button"
                        className="text-red-700 underline hover:opacity-75"
                        onClick={() => handleRemoveReadinessDocument(document.category)}
                      >
                        {text("Remove", "हटाएँ")}
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 grid sm:grid-cols-[1fr_auto] gap-2">
              <select
                value={readinessType}
                onChange={(event) => setReadinessType(event.target.value)}
                className="h-11 px-3 rounded-lg bg-recessed border border-chassis-dark/30 font-mono text-xs"
              >
                <option value="">
                  {text("Choose document category", "दस्तावेज़ श्रेणी चुनें")}
                </option>
                <option value="identity">{text("Identity proof", "पहचान प्रमाण")}</option>
                <option value="caste">{text("Caste certificate", "जाति प्रमाण पत्र")}</option>
                <option value="income">{text("Income certificate", "आय प्रमाण पत्र")}</option>
                <option value="domicile">{text("Domicile certificate", "निवास प्रमाण पत्र")}</option>
                <option value="bank">{text("Bank proof", "बैंक प्रमाण")}</option>
                <option value="quotation">{text("Project quotation", "परियोजना कोटेशन")}</option>
              </select>
              <label className="flex items-center justify-center gap-2 px-4 rounded-lg border border-dashed border-accent text-accent cursor-pointer font-mono text-xs">
                <FileCheck className="w-4 h-4" />{" "}
                {text("Attach", "संलग्न करें")}
                <input
                  ref={readinessFileRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleReadinessUpload}
                  disabled={!readinessType}
                />
              </label>
            </div>
            {readinessError && (
              <p className="mt-2 font-mono text-xs text-red-700">
                {readinessError}
              </p>
            )}
            {!readinessType && !readinessError && (
              <p className="mt-2 font-mono text-[11px] text-ink-muted">
                {text(
                  "Select a document category first, then attach the file.",
                  "पहले दस्तावेज़ श्रेणी चुनें, फिर फ़ाइल संलग्न करें।",
                )}
              </p>
            )}
            {false && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-panel shadow-recessed">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-ink">
                        Aadhaar Card Linked to Mobile
                      </span>
                      <span className="font-mono text-[10px] text-ink-muted">
                        UIDAI e-KYC Verified on 10 Feb 2025
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-chassis text-emerald-600 font-bold shadow-sm">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-panel shadow-recessed">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-ink">
                        Caste Certificate (SC/ST/OBC)
                      </span>
                      <span className="font-mono text-[10px] text-ink-muted">
                        Verified via DigiLocker Repository
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-chassis text-emerald-600 font-bold shadow-sm">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-panel shadow-recessed">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-ink">
                        Project Machinery Quotation
                      </span>
                      <span className="font-mono text-[10px] text-ink-muted">
                        Uploaded: {formatCurrency(480000)} for Textile
                      </span>
                    </div>
                  </div>
                  <TactileButton variant="ghost" size="sm" iconRight={Eye}>
                    View
                  </TactileButton>
                </div>
              </div>
            )}
          </IndustrialCard>
        </div>

        <div className="lg:col-span-5">
          <IndustrialCard
            className="p-6 flex flex-col justify-between"
            cornerScrews
          >
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-industrial-border-shadow/20">
                <h2 className="font-bold text-sm text-ink uppercase tracking-tight flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-accent" />
                  <span>Recent Agency Notices</span>
                </h2>
                <LedIndicator color="orange" size="sm" />
              </div>
              <p className="p-3 rounded-lg bg-panel shadow-recessed text-xs text-ink-muted">
                {text(
                  "No live notices are available for this account.",
                  "इस खाते के लिए कोई लाइव सूचना उपलब्ध नहीं है।",
                )}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-industrial-border-shadow/20 flex items-center justify-between">
              <span className="font-mono text-xs text-ink-muted">
                Need desk assistance?
              </span>
              <NavLink
                to="/help"
                className="font-mono text-xs text-accent font-bold hover:underline flex items-center gap-1"
              >
                <span>Find Facilitator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </IndustrialCard>
        </div>
      </div>

      {/* Official Mechanical Footer */}
      <footer className="w-full rounded-xl bg-chassis p-4 shadow-card border border-white/60 mt-4">
        <div className="flex flex-wrap items-center justify-between text-ink-muted font-mono text-xs gap-3">
          <div>
            Official portal of the Ministry of Social Justice & Empowerment •
            Government of India
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" /> Certified Data Privacy
            </span>
            <span>Helpline: 1800-11-7788</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
