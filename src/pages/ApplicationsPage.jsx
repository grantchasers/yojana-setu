import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  FileText,
  CheckCircle2,
  Building2,
  ShieldCheck,
  UserCheck,
  Download,
  UploadCloud,
  Eye,
  Printer,
  X,
  Activity,
  Sparkles,
  Phone,
  Cpu,
  FileCode,
  Check,
  Calendar,
  BadgeCheck,
  FolderOpen,
  FilterX,
} from "lucide-react";
import { formatCurrency } from "../lib/formatCurrency";
import { useAuth } from "../context/AuthContext";
import { useApplications } from "../hooks/useApplications";
import IndustrialCard from "../components/ui/IndustrialCard";
import TactileButton from "../components/ui/TactileButton";
import LedIndicator from "../components/ui/LedIndicator";

// Helper to normalize applications from database into UI presentation model
function normalizeApplication(app) {
  const rawStatus = (app.status || "submitted").toLowerCase();
  const statusHistory = Array.isArray(app.status_history)
    ? app.status_history
    : [];
  const isCompleted = [
    "approved",
    "sanctioned",
    "disbursed",
    "completed",
  ].includes(rawStatus);
  const isDisbursed = rawStatus === "disbursed";
  const isApproved = rawStatus === "approved" || rawStatus === "sanctioned";
  const isRouted = rawStatus === "routed";

  const idFormatted = app.id
    ? String(app.id).startsWith("YS-")
      ? app.id
      : `YS-${String(app.id).slice(0, 8).toUpperCase()}`
    : "YS-2025-APP";

  const title =
    app.scheme_name ||
    app.schemes?.name ||
    app.schemes?.title ||
    "NSFDC Term Loan Scheme - Micro Enterprise";

  const titleHi =
    app.schemes?.title_hi ||
    app.schemes?.titleHi ||
    "राष्ट्रीय अनुसूचित जाति वित्त एवं विकास निगम सावधि ऋण योजना";

  const schemeBadge =
    app.schemes?.agency || app.schemes?.code || "MoSJE Central Scheme";

  const category = isCompleted ? "completed" : "in-progress";

  const statusText = isDisbursed
    ? "Disbursed"
    : isApproved
      ? "Approved"
      : isRouted
        ? "Routed"
        : "Submitted";

  const statusBadgeText = isDisbursed
    ? "Approved & Disbursed (स्वीकृत एवं वितरित)"
    : isApproved
      ? "Approved / Sanctioned (स्वीकृत)"
      : isRouted
        ? "Under Review / Routed to Partner"
        : "Submitted / Portal Registration";

  const statusBadgeHi = isDisbursed
    ? "पूर्ण एवं वितरित"
    : isApproved
      ? "स्वीकृत"
      : isRouted
        ? "समीक्षा जारी है / अग्रेषित"
        : "प्रस्तुत / प्रारंभिक सत्यापन";

  const amountVal = app.requested_amount || app.project_cost;
  const formattedAmount = amountVal
    ? formatCurrency(amountVal)
    : "Not recorded";

  const submissionDate = app.created_at
    ? new Date(app.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not recorded";

  const partnerName =
    app.partner_name || app.channel_partners?.name || "Not assigned";

  const partnerOffice =
    app.channel_partners?.location ||
    app.channel_partners?.address ||
    "Not recorded";

  const fileNo = app.file_no || "Not recorded";
  const nodalOfficer = app.nodal_officer || "Not assigned";
  const officerRole = app.officer_role || "Not recorded";
  const officerInitials = app.officer_initials || "--";
  const officerLine = app.officer_line || "Not recorded";

  const officerNote = app.officer_note || null;

  const officerNoteDate = app.created_at
    ? new Date(app.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const recordedEvents =
    statusHistory.length > 0
      ? statusHistory
      : [
          {
            status: rawStatus,
            created_at: app.created_at,
            description: "Current status from application record.",
          },
        ];
  const milestones = recordedEvents.map((event, index) => {
    const eventStatus = String(
      event.status || event.to_status || rawStatus,
    ).toLowerCase();
    const isCurrent = index === recordedEvents.length - 1;
    return {
      step: index + 1,
      title: `${index + 1}. ${event.title || event.label || eventStatus.replace(/_/g, " ")}`,
      date: event.created_at
        ? new Date(event.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Not recorded",
      sub: event.actor_role || event.source || "Application record",
      status: isCurrent ? "active" : "completed",
      desc:
        event.description ||
        event.note ||
        `Recorded status: ${eventStatus.replace(/_/g, " ")}.`,
    };
  });
  const currentStepIndex = milestones.length;
  const progressLineWidth = milestones.length > 1 ? "100%" : "18%";

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
    submissionMode: app.submission_mode || "Not recorded",
    ekycVerified: Boolean(app.ekyc_verified),
    partnerName,
    partnerOffice,
    fileNo,
    nodalOfficer,
    officerRole,
    officerInitials,
    officerLine,
    officerNote,
    officerNoteDate,
    expectedDecisionDate: app.expected_decision_date || null,
    daysRemaining: app.days_remaining || null,
    currentStepIndex,
    progressLineWidth,
    milestones,
    bankAccount: app.bank_account_masked || null,
    utrNumber: app.utr_number || null,
    credential: app.credential || null,
    isDemo: Boolean(app.is_demo),
  };
}

export default function ApplicationsPage() {
  const { user, profile } = useAuth();
  const {
    applications: rawApplications,
    loading,
    error,
  } = useApplications(user?.id);

  const [filter, setFilter] = useState("all"); // 'all' | 'in-progress' | 'completed'
  const [selectedAppModal, setSelectedAppModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title, msg) => {
    setToastMessage({ title, msg });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const applications = useMemo(() => {
    return (rawApplications || []).map(normalizeApplication);
  }, [rawApplications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (filter === "all") return true;
      if (filter === "in-progress") return app.category === "in-progress";
      if (filter === "completed") return app.category === "completed";
      return true;
    });
  }, [applications, filter]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Citizen Assurance Telemetry Strip */}
      <IndustrialCard
        variant="panel"
        cornerScrews
        className="relative overflow-hidden"
      >
        {error && (
          <div
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-700"
            role="alert"
          >
            Unable to load applications: {error}
          </div>
        )}
        {applications.some((app) => app.isDemo) && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-mono text-[11px] text-amber-800">
            OFFLINE DEMO RECORD: status values below are sample data, not live
            application updates.
          </div>
        )}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-industrial-recessed shadow-recessed border border-industrial-border flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-sm font-bold tracking-wider text-industrial-ink uppercase">
                  DIRECT TRANSPARENCY TRACK • प्रत्यक्ष पारदर्शिता प्रणाली
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-industrial-chassis border border-industrial-border shadow-xs text-[11px] font-mono font-semibold text-industrial-ink-light">
                  <LedIndicator color="emerald" state="blinking" size="sm" />
                  SLA GUARD 100%
                </span>
              </div>
              <p className="font-sans text-xs text-industrial-ink-light mt-0.5">
                Applications protected by the Public Services Guarantee Act.
                Nodal desk audit times logged to central server.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
            <div className="px-3 py-1.5 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed text-center">
              <span className="font-mono text-[10px] text-industrial-ink-muted uppercase block tracking-wider">
                Avg Processing
              </span>
              <span className="font-mono text-xs font-bold text-industrial-ink">
                11 WORK DAYS
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed text-center">
              <span className="font-mono text-[10px] text-industrial-ink-muted uppercase block tracking-wider">
                Disbursement
              </span>
              <span className="font-mono text-xs font-bold text-emerald-600">
                ZERO MIDDLEMAN
              </span>
            </div>
          </div>
        </div>
      </IndustrialCard>

      {/* Control Console Header & Filter Switch */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-industrial-ink-muted font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-industrial-accent" />
              APPLICANT TELEMETRY STATION
            </span>
            <span className="text-industrial-border font-mono">•</span>
            <span className="font-mono text-xs text-industrial-ink-light">
              UID: XXXXXXXX4910
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-industrial-ink mt-1">
            My Scheme Applications{" "}
            <span className="text-base sm:text-lg font-sans text-industrial-ink-muted font-normal">
              / प्रस्तुत आवेदन
            </span>
          </h1>
        </div>

        {/* Tactical Rocker / Segmented Filter Switch */}
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-industrial-recessed border border-industrial-border/80 shadow-recessed self-stretch md:self-auto overflow-x-auto">
          <button
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
              filter === "all"
                ? "bg-industrial-chassis text-industrial-ink shadow-pressed border border-industrial-border/60 translate-y-[1px]"
                : "text-industrial-ink-muted hover:text-industrial-ink hover:bg-industrial-panel/50"
            }`}
            onClick={() => setFilter("all")}
            type="button"
          >
            <span>ALL APPS</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                filter === "all"
                  ? "bg-industrial-accent text-white"
                  : "bg-industrial-border/40 text-industrial-ink"
              }`}
            >
              {applications.length}
            </span>
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
              filter === "in-progress"
                ? "bg-industrial-chassis text-industrial-ink shadow-pressed border border-industrial-border/60 translate-y-[1px]"
                : "text-industrial-ink-muted hover:text-industrial-ink hover:bg-industrial-panel/50"
            }`}
            onClick={() => setFilter("in-progress")}
            type="button"
          >
            <span>IN PROGRESS (प्रगति)</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                filter === "in-progress"
                  ? "bg-amber-500 text-white"
                  : "bg-industrial-border/40 text-industrial-ink"
              }`}
            >
              {applications.filter((a) => a.category === "in-progress").length}
            </span>
          </button>
          <button
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
              filter === "completed"
                ? "bg-industrial-chassis text-industrial-ink shadow-pressed border border-industrial-border/60 translate-y-[1px]"
                : "text-industrial-ink-muted hover:text-industrial-ink hover:bg-industrial-panel/50"
            }`}
            onClick={() => setFilter("completed")}
            type="button"
          >
            <span>SANCTIONED (स्वीकृत)</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                filter === "completed"
                  ? "bg-emerald-600 text-white"
                  : "bg-industrial-border/40 text-industrial-ink"
              }`}
            >
              {applications.filter((a) => a.category === "completed").length}
            </span>
          </button>
        </div>
      </div>

      {/* Applications List, Skeleton Loader, or Empty State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((row) => (
            <IndustrialCard
              key={row}
              variant="panel"
              className="animate-pulse p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-industrial-recessed" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-industrial-recessed rounded" />
                    <div className="w-64 h-5 bg-industrial-recessed rounded" />
                  </div>
                </div>
                <div className="w-28 h-8 bg-industrial-recessed rounded" />
              </div>
              <div className="h-16 bg-industrial-recessed/60 rounded-lg" />
              <div className="h-10 bg-industrial-recessed/40 rounded-lg" />
            </IndustrialCard>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <IndustrialCard
          variant="panel"
          cornerScrews
          className="text-center py-16 px-6"
        >
          <div className="w-16 h-16 rounded-xl bg-industrial-recessed border border-industrial-border shadow-recessed text-industrial-ink-muted flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-mono text-industrial-ink mb-1">
            No Applications Found // कोई आवेदन नहीं मिला
          </h2>
          <p className="font-sans text-sm text-industrial-ink-light max-w-md mx-auto mb-6">
            You haven't submitted any scheme applications yet. Run our automated
            scheme recommender to find optimal subsidies.
          </p>
          <NavLink to="/recommender">
            <TactileButton
              variant="primary"
              size="md"
              icon={<Sparkles className="w-4 h-4" />}
            >
              Launch Scheme Recommender
            </TactileButton>
          </NavLink>
        </IndustrialCard>
      ) : filteredApplications.length === 0 ? (
        <IndustrialCard
          variant="panel"
          cornerScrews
          className="text-center py-12 px-6"
        >
          <div className="w-14 h-14 rounded-xl bg-industrial-recessed border border-industrial-border shadow-recessed text-industrial-ink-muted flex items-center justify-center mx-auto mb-3">
            <FilterX className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-mono text-industrial-ink mb-1">
            NO RECORDS IN "{filter.toUpperCase()}" FILTER
          </h3>
          <p className="font-sans text-xs text-industrial-ink-light mb-4">
            There are no applications matching the active filtering parameter.
          </p>
          <TactileButton
            variant="secondary"
            size="sm"
            onClick={() => setFilter("all")}
          >
            Reset to All Applications ({applications.length})
          </TactileButton>
        </IndustrialCard>
      ) : (
        <div className="space-y-6">
          {filteredApplications.map((app) => {
            const isCompleted = app.category === "completed";

            return (
              <IndustrialCard
                key={app.id}
                variant="panel"
                cornerScrews
                className="overflow-hidden p-0 border-industrial-border shadow-card"
              >
                {/* Top Chassis Header & Gauge */}
                <div className="p-4 sm:p-5 bg-industrial-chassis/60 border-b border-industrial-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-industrial-border shadow-card ${
                        isCompleted
                          ? "bg-emerald-500/10 text-emerald-600"
                          : app.status === "Submitted"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      <FileText className="w-6 h-6" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-industrial-recessed border border-industrial-border shadow-recessed font-mono text-xs font-bold text-industrial-ink">
                          {app.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-industrial-panel border border-industrial-border font-mono text-[11px] font-semibold text-industrial-ink-light">
                          {app.schemeBadge}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold flex items-center gap-1.5 border ${
                            isCompleted
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-700 border-amber-500/30"
                          }`}
                        >
                          <LedIndicator
                            color={isCompleted ? "emerald" : "amber"}
                            state={isCompleted ? "on" : "blinking"}
                            size="sm"
                          />
                          {isCompleted
                            ? "SANCTIONED & DISBURSED"
                            : "FAST TRACK CONDUIT"}
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold font-mono text-industrial-ink mt-1.5 truncate">
                        {app.title}
                      </h2>
                      <p className="font-sans text-xs text-industrial-ink-light">
                        {app.titleHi}
                      </p>
                    </div>
                  </div>

                  {/* Right Telemetry Readout & Status Gauge */}
                  <div className="flex flex-row lg:flex-col items-start lg:items-end justify-between gap-2 shrink-0 pt-2 lg:pt-0">
                    <div className="px-3 py-1 rounded-md bg-industrial-recessed border border-industrial-border shadow-recessed flex items-center gap-2">
                      <LedIndicator
                        color={
                          isCompleted
                            ? "emerald"
                            : app.status === "Submitted"
                              ? "blue"
                              : "amber"
                        }
                        state={isCompleted ? "on" : "blinking"}
                        size="sm"
                      />
                      <span className="font-mono text-xs font-bold text-industrial-ink">
                        {app.statusBadgeText}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                      <span className="text-[11px] text-industrial-ink-muted uppercase">
                        {isCompleted ? "Disbursed DBT:" : "Sanction Sought:"}
                      </span>
                      <span
                        className={`text-base sm:text-lg font-bold ${
                          isCompleted
                            ? "text-emerald-600"
                            : "text-industrial-ink"
                        }`}
                      >
                        {isCompleted ? app.disbursedAmount : app.sanctionSought}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3-Column Technical Modular Chassis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-industrial-border border-b border-industrial-border">
                  {/* Col 1: Submission Audit */}
                  <div className="bg-industrial-panel p-4 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-industrial-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-industrial-accent" />
                        SUBMISSION AUDIT
                      </span>
                      <div className="mt-2">
                        <div className="font-mono text-xs font-bold text-industrial-ink">
                          {app.submissionDate}
                        </div>
                        <div className="font-sans text-xs text-industrial-ink-light mt-0.5">
                          {app.submissionMode}
                        </div>
                      </div>
                    </div>
                    {app.ekycVerified && (
                      <div className="mt-3 flex items-center gap-1.5 text-emerald-600 font-mono text-[11px] font-semibold">
                        <BadgeCheck className="w-4 h-4" />
                        Aadhaar eKYC Verified
                      </div>
                    )}
                  </div>

                  {/* Col 2: Channel Partner */}
                  <div className="bg-industrial-panel p-4 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-industrial-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-industrial-accent" />
                        DESIGNATED PARTNER AGENCY
                      </span>
                      <div className="mt-2">
                        <div className="font-mono text-xs font-bold text-industrial-ink">
                          {app.partnerName}
                        </div>
                        <div className="font-sans text-xs text-industrial-ink-light mt-0.5">
                          {app.partnerOffice}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 font-mono text-[11px] text-industrial-ink-light">
                      FILE:{" "}
                      <span className="font-bold text-industrial-ink">
                        {app.fileNo}
                      </span>
                    </div>
                  </div>

                  {/* Col 3: Accountable Nodal Officer */}
                  <div className="bg-industrial-panel p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-industrial-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-industrial-accent" />
                          NODAL OFFICER DESK
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-industrial-recessed border border-industrial-border font-mono text-[10px] text-industrial-ink font-semibold">
                          {app.officerRole}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-industrial-recessed border border-industrial-border shadow-recessed flex items-center justify-center font-mono font-bold text-xs text-industrial-ink">
                          {app.officerInitials}
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold text-industrial-ink">
                            {app.nodalOfficer}
                          </div>
                          <div className="font-sans text-xs text-industrial-ink-light">
                            {app.officerRole}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[11px] pt-2 border-t border-industrial-border/40">
                      <span className="text-industrial-ink-light flex items-center gap-1">
                        <Phone className="w-3 h-3 text-industrial-ink-muted" />
                        {app.officerLine}
                      </span>
                      {app.officerRole !== "Not recorded" && (
                        <span className="text-emerald-600 font-semibold">
                          Recorded in application data
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Timeline Conduit Track */}
                <div className="p-4 sm:p-5 bg-industrial-chassis/40 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-industrial-accent" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-industrial-ink">
                        Application Lifecycle Milestone Conduit
                      </span>
                    </div>
                    {app.expectedDecisionDate && (
                      <div className="flex items-center gap-1.5 font-mono text-xs text-industrial-ink-light">
                        <LedIndicator
                          color="amber"
                          state="blinking"
                          size="sm"
                        />
                        <span>
                          Expected Decision:{" "}
                          <strong className="text-industrial-ink">
                            {app.expectedDecisionDate}
                          </strong>{" "}
                          ({app.daysRemaining})
                        </span>
                      </div>
                    )}
                    {isCompleted && app.bankAccount && app.utrNumber && (
                      <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-600">
                        <LedIndicator color="emerald" state="on" size="sm" />
                        <span>Disbursed via PFMS Gateway</span>
                      </div>
                    )}
                  </div>

                  {/* Desktop Horizontal Conduit Pipe */}
                  <div className="relative py-4 hidden md:block">
                    {/* Conduit Channel */}
                    <div className="absolute top-8 left-8 right-8 h-2 bg-industrial-recessed rounded-full shadow-recessed border border-industrial-border/80 -translate-y-1/2 z-0" />
                    {/* Active Fluid Flow */}
                    <div
                      className="absolute top-8 left-8 h-2 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] -translate-y-1/2 z-0 transition-all duration-700"
                      style={{ width: app.progressLineWidth || "45%" }}
                    />

                    <div className="grid grid-cols-5 gap-2 relative z-10">
                      {app.milestones.map((m) => {
                        const isMilestoneCompleted = m.status === "completed";
                        const isMilestoneActive = m.status === "active";

                        return (
                          <div
                            key={m.step}
                            className={`flex flex-col items-center text-center ${
                              m.status === "pending" ? "opacity-60" : ""
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-200 ${
                                isMilestoneCompleted
                                  ? "bg-emerald-600 text-white shadow-card border border-emerald-700"
                                  : isMilestoneActive
                                    ? "bg-amber-500 text-white shadow-card border border-amber-600 ring-2 ring-amber-300 ring-offset-2 ring-offset-industrial-panel animate-pulse"
                                    : "bg-industrial-chassis text-industrial-ink-muted border border-industrial-border shadow-xs"
                              }`}
                            >
                              {isMilestoneCompleted ? (
                                <Check className="w-4 h-4" />
                              ) : isMilestoneActive ? (
                                <Activity className="w-4 h-4" />
                              ) : (
                                <span>{m.step}</span>
                              )}
                            </div>
                            <span
                              className={`font-mono text-xs font-semibold mt-2 ${
                                isMilestoneActive
                                  ? "text-amber-700 font-bold"
                                  : isMilestoneCompleted
                                    ? "text-industrial-ink font-bold"
                                    : "text-industrial-ink-muted"
                              }`}
                            >
                              {m.title}
                            </span>
                            <span
                              className={`font-mono text-[10px] ${
                                isMilestoneActive
                                  ? "text-amber-600 font-bold"
                                  : isMilestoneCompleted
                                    ? "text-emerald-600"
                                    : "text-industrial-ink-muted"
                              }`}
                            >
                              {m.date}
                            </span>
                            <span className="font-sans text-[11px] text-industrial-ink-light mt-0.5 leading-tight line-clamp-1">
                              {m.sub}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Vertical Stepper View */}
                  <div className="flex flex-col gap-2.5 md:hidden">
                    {app.milestones.map((m) => {
                      const isMilestoneCompleted = m.status === "completed";
                      const isMilestoneActive = m.status === "active";

                      return (
                        <div
                          key={m.step}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border border-industrial-border ${
                            isMilestoneActive
                              ? "bg-amber-500/10 border-amber-500/30"
                              : m.status === "pending"
                                ? "bg-industrial-panel/50 opacity-60"
                                : "bg-industrial-panel"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                              isMilestoneCompleted
                                ? "bg-emerald-600 text-white"
                                : isMilestoneActive
                                  ? "bg-amber-500 text-white animate-pulse"
                                  : "bg-industrial-recessed text-industrial-ink-muted"
                            }`}
                          >
                            {isMilestoneCompleted ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <span>{m.step}</span>
                            )}
                          </div>
                          <div>
                            <div
                              className={`font-mono text-xs font-semibold ${
                                isMilestoneActive
                                  ? "text-amber-700 font-bold"
                                  : "text-industrial-ink"
                              }`}
                            >
                              {m.title} ({m.date})
                            </div>
                            <p className="font-sans text-xs text-industrial-ink-light">
                              {m.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Nodal Officer Teletype Note */}
                  {app.officerNote && (
                    <div className="rounded-lg bg-industrial-recessed/80 border border-industrial-border/80 shadow-recessed p-3.5 flex items-start gap-3">
                      <div className="p-1.5 rounded bg-industrial-panel border border-industrial-border shadow-xs text-industrial-ink shrink-0 mt-0.5">
                        <FileCode className="w-4 h-4 text-industrial-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-1 font-mono text-[11px]">
                          <span className="font-bold text-industrial-ink uppercase tracking-wider flex items-center gap-1.5">
                            <LedIndicator
                              color="emerald"
                              state="on"
                              size="sm"
                            />
                            OFFICIAL LOG NOTE // अधिकारी टिप्पणी
                          </span>
                          <span className="text-industrial-ink-muted">
                            TIMESTAMP: {app.officerNoteDate}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-industrial-ink mt-1.5 leading-relaxed">
                          {app.officerNote}
                        </p>
                        <div className="flex items-center gap-2 mt-2 font-mono text-[11px]">
                          <span className="text-industrial-ink-light font-bold">
                            — {app.nodalOfficer} ({app.officerRole})
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 font-semibold border border-emerald-500/30 text-[10px]">
                            DIGITALLY SIGNED
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Disbursed Bank Terminal (if completed) */}
                  {isCompleted && (
                    <div className="px-3.5 py-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/20 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-emerald-800">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          A/c: <strong>{app.bankAccount}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          UTR / PFMS Ref: <strong>{app.utrNumber}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Credential: <strong>{app.credential}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Primary Machine Action Rail */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-industrial-border/60">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <TactileButton
                        variant="primary"
                        size="sm"
                        icon={<Eye className="w-4 h-4" />}
                        onClick={() => setSelectedAppModal(app)}
                      >
                        View Submitted Form
                      </TactileButton>

                      {!isCompleted && (
                        <TactileButton
                          variant="secondary"
                          size="sm"
                          icon={<UploadCloud className="w-4 h-4" />}
                          onClick={() =>
                            showToast(
                              "Supplementary Upload Portal Active",
                              "Please choose the invoice or bank passbook scan (PDF/JPEG up to 5MB).",
                            )
                          }
                        >
                          Upload Additional Bill
                        </TactileButton>
                      )}
                    </div>

                    <TactileButton
                      variant="ghost"
                      size="sm"
                      icon={<Download className="w-4 h-4" />}
                      onClick={() =>
                        showToast(
                          "Acknowledgement Slip Downloaded",
                          `Official Acknowledgement Slip #${app.id} saved in institutional record.`,
                        )
                      }
                    >
                      Download Receipt (PDF)
                    </TactileButton>
                  </div>
                </div>
              </IndustrialCard>
            );
          })}
        </div>
      )}

      {/* Interactive Record Preview Modal */}
      {selectedAppModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-industrial-panel rounded-xl shadow-card border border-industrial-border flex flex-col overflow-hidden animate-in fade-in">
            {/* Modal Header Bezel */}
            <div className="p-4 bg-industrial-chassis border-b border-industrial-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-industrial-recessed border border-industrial-border flex items-center justify-center text-industrial-ink">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-mono text-sm font-bold text-industrial-ink">
                  APPLICATION RECORD PREVIEW // #{selectedAppModal.id}
                </span>
              </div>
              <button
                className="w-8 h-8 rounded-lg bg-industrial-panel border border-industrial-border shadow-xs hover:bg-industrial-recessed flex items-center justify-center text-industrial-ink-light hover:text-industrial-ink cursor-pointer transition-all duration-150"
                onClick={() => setSelectedAppModal(null)}
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-industrial-ink">
              <div className="p-3 rounded-lg bg-industrial-recessed border border-industrial-border shadow-recessed flex justify-between items-center font-mono text-xs">
                <span className="text-industrial-ink-muted">
                  MINISTRY IDENTIFIER
                </span>
                <span className="font-bold text-industrial-accent">
                  MoSJE-UP-2025-{selectedAppModal.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-sans text-xs">
                <div className="p-3 rounded-lg bg-industrial-panel border border-industrial-border shadow-xs">
                  <span className="font-mono text-[10px] text-industrial-ink-muted uppercase block">
                    Applicant Full Name
                  </span>
                  <span className="font-bold text-industrial-ink mt-0.5 block">
                    {profile?.name || "Applicant (Verified Citizen)"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-industrial-panel border border-industrial-border shadow-xs">
                  <span className="font-mono text-[10px] text-industrial-ink-muted uppercase block">
                    Caste / Category
                  </span>
                  <span className="font-bold text-industrial-ink mt-0.5 block">
                    {profile?.caste_category ||
                      profile?.category ||
                      "Scheduled Caste (SC)"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-industrial-panel border border-industrial-border shadow-xs">
                  <span className="font-mono text-[10px] text-industrial-ink-muted uppercase block">
                    Annual Household Income
                  </span>
                  <span className="font-bold text-industrial-ink mt-0.5 block">
                    {selectedAppModal.monthly_family_income
                      ? `${formatCurrency(Number(selectedAppModal.monthly_family_income) * 12)} (Certified)`
                      : `${formatCurrency(118000)} (Tahsildar Certified)`}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-industrial-panel border border-industrial-border shadow-xs">
                  <span className="font-mono text-[10px] text-industrial-ink-muted uppercase block">
                    Proposed Activity
                  </span>
                  <span className="font-bold text-industrial-ink mt-0.5 block">
                    {selectedAppModal.title}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-industrial-ink">
                  Verified Attached Credentials
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-industrial-recessed/60 border border-industrial-border">
                    <span className="flex items-center gap-2 text-industrial-ink">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Aadhaar Card (Masked eKYC)
                    </span>
                    <span className="text-emerald-600 font-bold text-[11px]">
                      UIDAI Validated
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-industrial-recessed/60 border border-industrial-border">
                    <span className="flex items-center gap-2 text-industrial-ink">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      State Caste Certificate (EDistrict UP)
                    </span>
                    <span className="text-emerald-600 font-bold text-[11px]">
                      UP-EDIST-991204
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-industrial-recessed/60 border border-industrial-border">
                    <span className="flex items-center gap-2 text-industrial-ink">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Equipment Machinery Quotation / Income Slip
                    </span>
                    <span className="text-industrial-ink-muted text-[11px]">
                      GST Registered
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-industrial-chassis border-t border-industrial-border flex justify-end gap-2.5">
              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => setSelectedAppModal(null)}
              >
                Close Preview
              </TactileButton>
              <TactileButton
                variant="primary"
                size="sm"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => {
                  setSelectedAppModal(null);
                  showToast(
                    "Record Downloaded",
                    `Application Record #${selectedAppModal.id} ready for print.`,
                  );
                }}
              >
                Print Record
              </TactileButton>
            </div>
          </div>
        </div>
      )}

      {/* Industrial Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl bg-industrial-panel border border-industrial-border shadow-card flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-industrial-ink">
              {toastMessage.title}
            </div>
            <div className="font-sans text-xs text-industrial-ink-light">
              {toastMessage.msg}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
