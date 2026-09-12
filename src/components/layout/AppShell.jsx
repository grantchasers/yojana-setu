import { useState } from "react";
import { useTranslation } from "react-i18next";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-chassis noise-chassis text-ink flex flex-col font-sans selection:bg-accent selection:text-white">
      {/* TopBar fixed at top (h-20) */}
      <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Desktop Sidebar fixed left (lg:w-72) */}
      <Sidebar />

      {/* Mobile Drawer overlay when sidebarOpen is true */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-chassis shadow-floating z-50 flex flex-col border-r border-white/60 animate-slide-in-left">
            <div className="h-20 flex items-center justify-between px-4 border-b border-industrial-border-dark/20 bg-panel">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_#e0c58f] animate-pulse" />
                <span className="font-bold font-mono text-sm tracking-tight text-ink uppercase">
                  {t("appName", "YojanaSetu")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="w-9 h-9 rounded-lg bg-chassis text-ink-muted shadow-card active:shadow-pressed flex items-center justify-center transition-all"
                aria-label="Close drawer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>
            <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content container with max-w-[72rem] standard */}
      <main className="ml-0 lg:ml-72 pt-20 min-h-screen text-left flex flex-col">
        <div
          key={i18n.language}
          className="w-full max-w-[72rem] mx-auto flex-1"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
