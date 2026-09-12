import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import LedIndicator from "../ui/LedIndicator";
import {
  Mic,
  Bell,
  LogOut,
  Menu,
  X,
  User,
  Settings,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  FileCheck,
  CheckCheck,
} from "lucide-react";

const MOCK_NOTIFICATIONS = [];

export default function TopBar({ sidebarOpen, setSidebarOpen }) {
  const { user, profile, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [notifyOpen, setNotifyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [voiceAssist, setVoiceAssist] = useState(true);

  const notifyRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const displayName =
    profile?.name ||
    (user?.user_metadata?.full_name ? user.user_metadata.full_name : null) ||
    (user?.email ? user.email.split("@")[0] : "Preview account");

  const userRoleLabel =
    profile?.role === "admin"
      ? t("topbar.adminRole", "Admin / व्यवस्थापक")
      : t("topbar.applicantRole", "Applicant / आवेदक");

  const avatarSrc =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBgw8NYcUh3xzIwD8jjd2eWp7EEJsH-FMUbDQP1tLW5T7ZK1n1hRZONM2rks1o7SPQ_gmZiWlt7lk5sSemjBMZd7LWdPHQHNGuMRlBC1B8Aq-U578C9T--OSFpnCsufjA0vJIPAPV5uMcXQRBVoEJz44aRV7VaLzpYO7sLw7paYDSfaJOVEKlpVSYAlHaly9oTDs1LQ_lHnUPu6JjREbdj3E7zeJbr_PvJEViIdQ_HMV_1Uya4xESBq";

  useEffect(() => {
    const onPointerDown = (event) => {
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setNotifyOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
        setSettingsOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setNotifyOpen(false);
        setProfileOpen(false);
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markOneRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut?.();
    navigate("/auth", { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-chassis/95 backdrop-blur-md z-40 border-b border-white/60 shadow-[0_4px_12px_rgba(186,190,204,0.4)]">
      <div className="h-20 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen?.(!sidebarOpen)}
            className="w-10 h-10 rounded-lg bg-chassis text-ink shadow-card active:shadow-pressed active:translate-y-[2px] flex items-center justify-center lg:hidden transition-all duration-150"
            aria-label={
              sidebarOpen ? "Close navigation drawer" : "Open navigation menu"
            }
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-ink uppercase embossed-text">
                {t(
                  "topbar.ministryTitle",
                  "सामाजिक न्याय और अधिकारिता मंत्रालय",
                )}
              </span>
              <span className="hidden xl:inline-flex">
                <LedIndicator color="green" label="ONLINE" size="sm" />
              </span>
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] text-ink-muted uppercase tracking-wider truncate max-w-[200px] sm:max-w-none">
              {t(
                "topbar.ministrySubtitle",
                "Ministry of Social Justice and Empowerment, Government of India",
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center bg-chassis rounded-lg p-1 shadow-recessed border border-industrial-border-shadow/20">
            <button
              type="button"
              onClick={() => void i18n.changeLanguage("en")}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all duration-150 ${
                i18n.language?.startsWith("en")
                  ? "bg-accent text-white shadow-btn-primary translate-y-[1px]"
                  : "text-ink-muted hover:text-ink"
              }`}
              aria-label="Switch language to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => void i18n.changeLanguage("hi")}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all duration-150 ${
                i18n.language?.startsWith("hi")
                  ? "bg-accent text-white shadow-btn-primary translate-y-[1px]"
                  : "text-ink-muted hover:text-ink"
              }`}
              aria-label="Switch language to Hindi"
            >
              HI
            </button>
          </div>

          <button
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-chassis text-ink font-mono text-xs font-bold uppercase tracking-wider shadow-card hover:shadow-floating active:shadow-pressed active:translate-y-[2px] transition-all duration-150 border border-white/50"
            title={t("topbar.voiceAssist", "Voice Assist / वाक् सहायता")}
            type="button"
            onClick={() => setVoiceAssist((v) => !v)}
          >
            <Mic
              className={`w-4 h-4 ${voiceAssist ? "text-accent" : "text-ink-muted"}`}
            />
            <span>{t("topbar.voice", "Voice")}</span>
          </button>

          <div className="relative" ref={notifyRef}>
            <button
              className={`w-10 h-10 rounded-lg bg-chassis text-ink shadow-card hover:shadow-floating active:shadow-pressed active:translate-y-[2px] flex items-center justify-center transition-all duration-150 border border-white/50 ${
                notifyOpen ? "shadow-pressed translate-y-[1px]" : ""
              }`}
              type="button"
              aria-label="Notifications"
              aria-expanded={notifyOpen}
              onClick={() => {
                setNotifyOpen((open) => !open);
                setProfileOpen(false);
              }}
            >
              <Bell className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-accent text-ink rounded-full font-mono text-[10px] font-bold flex items-center justify-center shadow-[0_0_6px_#e0c58f]">
                {unreadCount}
              </span>
            )}

            {notifyOpen && (
              <div className="absolute right-0 mt-3 w-[min(100vw-2rem,22rem)] rounded-xl bg-chassis shadow-floating border border-white/70 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 bg-panel border-b border-chassis-dark/20 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                      Inbox // सूचनाएं
                    </p>
                    <p className="font-mono text-xs font-bold text-ink uppercase">
                      Operator alerts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-chassis shadow-card hover:shadow-floating active:shadow-pressed font-mono text-[10px] font-bold uppercase text-ink hover:text-accent transition-all"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all as read
                  </button>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => markOneRead(item.id)}
                          className="w-full text-left px-4 py-3 flex gap-3 border-b border-chassis-dark/10 hover:bg-panel transition-colors"
                        >
                          <span className="w-9 h-9 rounded-lg bg-chassis shadow-card flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-accent" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-ink truncate">
                                {item.title}
                              </span>
                              {item.unread && (
                                <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_#e0c58f] shrink-0" />
                              )}
                            </span>
                            <span className="block font-sans text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                              {item.body}
                            </span>
                            <span className="block font-mono text-[10px] text-ink-muted mt-1 uppercase tracking-wider">
                              {item.time}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="hidden sm:block h-7 w-[2px] bg-industrial-border-shadow/40 mx-1" />

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open);
                setNotifyOpen(false);
                setSettingsOpen(false);
              }}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-panel shadow-recessed border border-white/60 hover:shadow-card transition-all ${
                profileOpen ? "ring-2 ring-accent/40" : ""
              }`}
            >
              <img
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-industrial-border-dark/30"
                src={avatarSrc}
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="font-bold text-xs text-ink leading-tight truncate max-w-[120px]">
                  {displayName}
                </span>
                <span className="font-mono text-[10px] text-accent font-bold uppercase tracking-wider leading-none">
                  {userRoleLabel}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-ink-muted hidden sm:block transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-64 rounded-xl bg-chassis shadow-floating border border-white/70 overflow-hidden z-50"
              >
                <div className="px-4 py-3 bg-panel border-b border-chassis-dark/20">
                  <p className="font-mono text-xs font-bold text-ink truncate">
                    {displayName}
                  </p>
                  <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                    {user?.email || "ramesh.kumar@yojanasetu.gov.in"}
                  </p>
                </div>
                <div className="p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/profile");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs font-bold uppercase text-ink hover:bg-panel hover:text-accent transition-colors"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setSettingsOpen((open) => !open)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs font-bold uppercase text-ink hover:bg-panel hover:text-accent transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  {settingsOpen && (
                    <div className="mx-2 mb-1 p-3 rounded-lg bg-panel shadow-recessed border border-chassis-dark/20 space-y-2">
                      <label className="flex items-center justify-between font-mono text-[10px] uppercase font-bold text-ink-muted">
                        Voice assist
                        <input
                          type="checkbox"
                          checked={voiceAssist}
                          onChange={() => setVoiceAssist((v) => !v)}
                          className="accent-accent"
                        />
                      </label>
                      <p className="font-sans text-[11px] text-ink-muted leading-relaxed">
                        Language is switched from the EN / HI rocker. Alerts
                        stay local to this terminal.
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs font-bold uppercase text-accent hover:bg-accent/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
