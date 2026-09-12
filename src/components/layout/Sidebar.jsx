import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LedIndicator from "../ui/LedIndicator";
import {
  LayoutDashboard,
  Sparkles,
  Calculator,
  MapPin,
  FolderCheck,
  Building2,
  Sliders,
  HelpCircle,
  PhoneCall,
} from "lucide-react";

export default function Sidebar({ isMobile = false, onClose }) {
  const { t } = useTranslation();

  const beneficiaryItems = [
    {
      to: "/",
      label: t("nav.dashboard", "Dashboard (डैशबोर्ड)"),
      icon: LayoutDashboard,
      dataPath: "dashboard",
      end: true,
    },
    {
      to: "/recommender",
      label: t("nav.recommender", "Scheme Recommender (योजना सिफारिश)"),
      icon: Sparkles,
      dataPath: "scheme-recommender",
      end: false,
    },
    {
      to: "/calculator",
      label: t("nav.calculator", "EMI Calculator (ईएमआई कैलकुलेटर)"),
      icon: Calculator,
      dataPath: "emi-calculator",
      end: false,
    },
    {
      to: "/locator",
      label: t("nav.locator", "Partner Locator (साझेदार खोजें)"),
      icon: MapPin,
      dataPath: "partner-locator",
      end: false,
    },
    {
      to: "/applications",
      label: t("nav.applications", "My Applications (मेरे आवेदन)"),
      icon: FolderCheck,
      dataPath: "my-applications",
      end: false,
    },
  ];

  const adminItems = [
    {
      to: "/admin",
      label: t("nav.adminPartners", "Admin: Partners (साझेदार प्रबंधन)"),
      icon: Building2,
      dataPath: "admin-partners",
      end: true,
    },
    {
      to: "/admin#schemes",
      label: t("nav.adminSchemes", "Admin: Scheme Master (योजना मास्टर)"),
      icon: Sliders,
      dataPath: "admin-scheme-master",
      end: false,
    },
  ];

  const generalItems = [
    {
      to: "/help",
      label: t("nav.help", "Help & Guidelines (सहायता)"),
      icon: HelpCircle,
      dataPath: "help-guidelines",
      end: false,
    },
  ];

  const navContent = (
    <div className="flex flex-col">
      {/* Official Emblem & Portal Title (Desktop) */}
      {!isMobile && (
        <div className="h-20 px-5 flex items-center gap-3 bg-panel border-b border-white/60">
          <img
            alt="YojanaSetu Official Emblem"
            className="h-9 w-auto object-contain drop-shadow-xs"
            src="https://lh3.googleusercontent.com/aida/AEtjO1XQ0chKXZN4x3iBM_v57_A4IDJ7GT_m12Tnlui_yZkw7-3ES_3A_C2MHw5PDm-OnBR3SyYwJnnb4Sv213XPHi-04B1K53W1wZ4hf5G4Nhx2o9b9lXVCxaePKFpOORpGz7pZoPcjVJw3kaWdmmJRSO6yRK1pk52a6ZAOJsShIW2uq5oCALIrpv9UENMmETFUiDryYr-ET5MV8Tagx0xv65pupAm76WjKnW2LIcGr0Wnir9wDTvpQR0PLY-M"
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm text-ink leading-tight tracking-tight uppercase embossed-text">
              {t("sidebar.brandName", "योजनासेतु | YojanaSetu")}
            </span>
            <span className="font-mono text-[10px] text-ink-muted leading-none mt-1 uppercase tracking-wider">
              {t("sidebar.brandMinistry", "Govt. of India | MoSJE")}
            </span>
          </div>
        </div>
      )}

      {/* Utility Status Bar - Dark Technical Strip */}
      <div className="px-5 py-2.5 bg-[#112250] text-[#f5f0e9] flex items-center justify-between border-y border-white/10 shadow-inner">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">
          {t("sidebar.publicUtilityPortal", "PORTAL RACK // 01")}
        </span>
        <LedIndicator color="green" label="VERIFIED" size="sm" />
      </div>

      {/* Navigation Links with Physical Button Depression Physics */}
      <nav className="flex flex-col gap-1.5 p-3 overflow-y-auto">
        {/* Beneficiary Services Section */}
        <span className="px-3 pt-2 pb-1 font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest">
          {t("nav.beneficiaryServices", "Beneficiary Services / सेवाएँ")}
        </span>
        {beneficiaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.dataPath}
              to={item.to}
              end={item.end}
              data-path={item.dataPath}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 select-none ${
                  isActive
                    ? "bg-chassis text-accent shadow-pressed translate-y-[1px] border-l-4 border-accent font-extrabold"
                    : "text-ink-muted hover:text-ink hover:bg-panel hover:shadow-card active:translate-y-[1px] active:shadow-pressed"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}

        <div
          role="separator"
          aria-hidden="true"
          className="my-2 h-[1px] bg-industrial-border-shadow/40"
        />

        {/* Administration Section */}
        <span className="px-3 pt-1 pb-1 font-mono text-[10px] font-bold text-ink-muted uppercase tracking-widest">
          {t("nav.administration", "Administration / प्रशासन")}
        </span>
        {adminItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.dataPath}
              to={item.to}
              end={item.end}
              data-path={item.dataPath}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 select-none ${
                  isActive
                    ? "bg-chassis text-accent shadow-pressed translate-y-[1px] border-l-4 border-accent font-extrabold"
                    : "text-ink-muted hover:text-ink hover:bg-panel hover:shadow-card active:translate-y-[1px] active:shadow-pressed"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}

        <div
          role="separator"
          aria-hidden="true"
          className="my-2 h-[1px] bg-industrial-border-shadow/40"
        />

        {/* Help & Guidelines */}
        {generalItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.dataPath}
              to={item.to}
              end={item.end}
              data-path={item.dataPath}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 select-none ${
                  isActive
                    ? "bg-chassis text-accent shadow-pressed translate-y-[1px] border-l-4 border-accent font-extrabold"
                    : "text-ink-muted hover:text-ink hover:bg-panel hover:shadow-card active:translate-y-[1px] active:shadow-pressed"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  // Bolted Emergency Communication Module
  const helpdeskCard = (
    <div className="relative m-3 p-4 rounded-xl bg-chassis border border-white/60 shadow-card corner-screws">
      <div className="flex items-center gap-2 text-accent mb-1.5">
        <PhoneCall className="w-3.5 h-3.5" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
          {t("sidebar.nationalHelpdesk", "National Helpdesk")}
        </span>
      </div>
      <div className="font-mono text-base font-extrabold text-ink tracking-tight">
        1800-11-7788
      </div>
      <p className="font-mono text-[10px] text-ink-muted mt-0.5">
        {t("sidebar.helpdeskHours", "Toll Free • 9:30 AM - 6:00 PM")}
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col justify-between bg-chassis overflow-y-auto">
        {navContent}
        {helpdeskCard}
      </div>
    );
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-72 bg-chassis border-r border-white/60 z-50 hidden lg:flex flex-col justify-between shadow-[4px_0_16px_rgba(186,190,204,0.4)]"
      aria-label="Sidebar Navigation"
    >
      {navContent}
      {helpdeskCard}
    </aside>
  );
}
