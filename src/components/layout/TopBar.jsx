import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

export default function TopBar({ sidebarOpen, setSidebarOpen }) {
  const { user, profile, signOut } = useAuth()
  const { t, i18n } = useTranslation()

  const displayName =
    profile?.name ||
    (user?.user_metadata?.full_name ? user.user_metadata.full_name : null) ||
    (user?.email ? user.email.split('@')[0] : 'Ramesh Kumar')

  const userRoleLabel =
    profile?.role === 'admin'
      ? t('topbar.adminRole', 'Admin / व्यवस्थापक')
      : t('topbar.applicantRole', 'Applicant / आवेदक')

  const avatarSrc =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBgw8NYcUh3xzIwD8jjd2eWp7EEJsH-FMUbDQP1tLW5T7ZK1n1hRZONM2rks1o7SPQ_gmZiWlt7lk5sSemjBMZd7LWdPHQHNGuMRlBC1B8Aq-U578C9T--OSFpnCsufjA0vJIPAPV5uMcXQRBVoEJz44aRV7VaLzpYO7sLw7paYDSfaJOVEKlpVSYAlHaly9oTDs1LQ_lHnUPu6JjREbdj3E7zeJbr_PvJEViIdQ_HMV_1Uya4xESBq'

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface-container-lowest/95 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 w-full px-4 sm:px-6 lg:px-gutter-lg flex items-center justify-between">
        {/* Left: Mobile hamburger & Ministry Details */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen?.(!sidebarOpen)}
            className="p-2 -ml-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high lg:hidden transition-all duration-200"
            aria-label={sidebarOpen ? 'Close navigation drawer' : 'Open navigation menu'}
          >
            <span className="material-symbols-outlined text-[24px]">
              {sidebarOpen ? 'close' : 'menu'}
            </span>
          </button>

          <div className="flex flex-col">
            <div className="font-title-md text-title-md text-primary tracking-tight font-bold text-xs sm:text-base leading-tight truncate max-w-[190px] sm:max-w-none">
              {t('topbar.ministryTitle', 'सामाजिक न्याय और अधिकारिता मंत्रालय')}
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant text-[10px] sm:text-[11px] leading-tight truncate max-w-[190px] sm:max-w-none">
              {t(
                'topbar.ministrySubtitle',
                'Ministry of Social Justice and Empowerment, Government of India'
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-space-md">
          {/* Language Toggle Pill */}
          <div className="inline-flex items-center bg-surface-container rounded-full p-1 border border-outline-variant/40">
            <button
              type="button"
              onClick={() => i18n.changeLanguage('en')}
              className={`px-2.5 sm:px-3 py-1 text-label-sm font-label-sm rounded-full transition-all duration-200 ${
                i18n.language?.startsWith('en')
                  ? 'bg-primary text-on-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              aria-label="Switch language to English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => i18n.changeLanguage('hi')}
              className={`px-2.5 sm:px-3 py-1 text-label-sm font-label-sm rounded-full transition-all duration-200 ${
                i18n.language?.startsWith('hi')
                  ? 'bg-primary text-on-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              aria-label="Switch language to Hindi"
            >
              हिंदी
            </button>
          </div>

          {/* Voice Assist Button */}
          <button
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-primary transition-all duration-200"
            title={t('topbar.voiceAssist', 'Voice Assist / वाक् सहायता')}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">mic</span>
            <span className="font-label-sm text-label-sm">{t('topbar.voice', 'Voice')}</span>
          </button>

          {/* Notifications with Badge */}
          <div className="relative">
            <button
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-200"
              type="button"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </button>
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-4 h-4 bg-error text-on-error rounded-full font-label-sm text-[10px] flex items-center justify-center font-bold">
              2
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-[1px] bg-outline-variant/60" />

          {/* User Profile Info */}
          <div className="flex items-center gap-space-sm pl-space-xs">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover shrink-0"
              src={avatarSrc}
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="font-title-sm text-title-sm text-on-surface leading-tight truncate max-w-[130px]">
                {displayName}
              </span>
              <span className="font-label-sm text-label-sm text-secondary leading-none font-bold">
                {userRoleLabel}
              </span>
            </div>

            {signOut && (
              <button
                type="button"
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 ml-0.5"
                aria-label="Sign out"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
