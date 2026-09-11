import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TopBar from './TopBar'
import Sidebar from './Sidebar'

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* TopBar fixed at top (h-16) */}
      <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Desktop Sidebar fixed left (top-16, lg:w-72) */}
      <Sidebar />

      {/* Mobile Drawer overlay when sidebarOpen is true */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-surface shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-4 border-b border-outline-variant/30">
              <span className="font-bold text-primary">{t('appName')}</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200"
                aria-label="Close drawer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="ml-0 lg:ml-72 pt-16 min-h-screen bg-background text-left">
        {children}
      </main>
    </div>
  )
}
