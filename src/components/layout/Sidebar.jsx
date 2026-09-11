import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Sidebar({ isMobile = false, onClose }) {
  const { t } = useTranslation()

  const beneficiaryItems = [
    {
      to: '/',
      label: t('nav.dashboard', 'Dashboard (डैशबोर्ड)'),
      icon: 'dashboard',
      dataPath: 'dashboard',
      end: true,
    },
    {
      to: '/recommender',
      label: t('nav.recommender', 'Scheme Recommender (योजना सिफारिश)'),
      icon: 'smart_toy',
      dataPath: 'scheme-recommender',
      end: false,
    },
    {
      to: '/calculator',
      label: t('nav.calculator', 'EMI Calculator (ईएमआई कैलकुलेटर)'),
      icon: 'calculate',
      dataPath: 'emi-calculator',
      end: false,
    },
    {
      to: '/locator',
      label: t('nav.locator', 'Partner Locator (साझेदार खोजें)'),
      icon: 'storefront',
      dataPath: 'partner-locator',
      end: false,
    },
    {
      to: '/applications',
      label: t('nav.applications', 'My Applications (मेरे आवेदन)'),
      icon: 'folder_shared',
      dataPath: 'my-applications',
      end: false,
    },
  ]

  const adminItems = [
    {
      to: '/admin',
      label: t('nav.adminPartners', 'Admin: Partners (साझेदार प्रबंधन)'),
      icon: 'corporate_fare',
      dataPath: 'admin-partners',
      end: true,
    },
    {
      to: '/admin#schemes',
      label: t('nav.adminSchemes', 'Admin: Scheme Master (योजना मास्टर)'),
      icon: 'tune',
      dataPath: 'admin-scheme-master',
      end: false,
    },
  ]

  const generalItems = [
    {
      to: '/help',
      label: t('nav.help', 'Help & Guidelines (सहायता)'),
      icon: 'help',
      dataPath: 'help-guidelines',
      end: false,
    },
  ]

  const navContent = (
    <div className="flex flex-col">
      {/* Official Emblem & Portal Title (Desktop) */}
      {!isMobile && (
        <div className="h-20 px-gutter-md flex items-center gap-space-sm bg-surface-container-lowest">
          <img
            alt="YojanaSetu Official Emblem"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1XQ0chKXZN4x3iBM_v57_A4IDJ7GT_m12Tnlui_yZkw7-3ES_3A_C2MHw5PDm-OnBR3SyYwJnnb4Sv213XPHi-04B1K53W1wZ4hf5G4Nhx2o9b9lXVCxaePKFpOORpGz7pZoPcjVJw3kaWdmmJRSO6yRK1pk52a6ZAOJsShIW2uq5oCALIrpv9UENMmETFUiDryYr-ET5MV8Tagx0xv65pupAm76WjKnW2LIcGr0Wnir9wDTvpQR0PLY-M"
          />
          <div className="flex flex-col">
            <span className="font-title-sm text-title-sm text-primary leading-tight tracking-tight">
              {t('sidebar.brandName', 'योजनासेतु | YojanaSetu')}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">
              {t('sidebar.brandMinistry', 'Govt. of India | MoSJE')}
            </span>
          </div>
        </div>
      )}

      {/* Utility Status Bar */}
      <div className="px-gutter-md py-space-sm bg-primary-container text-on-primary-container flex items-center justify-between">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary">
          {t('sidebar.publicUtilityPortal', 'Public Utility Portal')}
        </span>
        <span className="inline-flex items-center px-space-xs py-0.5 rounded-lg bg-tertiary text-tertiary-fixed font-label-sm text-label-sm">
          {t('sidebar.liveVerified', 'Live Verified')}
        </span>
      </div>

      {/* Navigation Links */}
      <nav
        className="flex flex-col gap-1 p-space-sm overflow-y-auto"
        data-active-classes="bg-primary-container text-on-primary font-bold shadow-sm"
      >
        {/* Beneficiary Services Section */}
        <span className="px-space-sm pt-space-xs pb-1 font-label-sm text-label-sm text-outline uppercase tracking-wider">
          {t('nav.beneficiaryServices', 'Beneficiary Services / सेवाएँ')}
        </span>
        {beneficiaryItems.map((item) => (
          <NavLink
            key={item.dataPath}
            to={item.to}
            end={item.end}
            data-path={item.dataPath}
            onClick={() => {
              if (isMobile && onClose) onClose()
            }}
            className={({ isActive }) =>
              `flex items-center gap-space-sm px-space-sm py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="font-body-md text-body-md">{item.label}</span>
          </NavLink>
        ))}

        <div className="my-space-xs h-[1px] bg-outline-variant/50" />

        {/* Administration Section */}
        <span className="px-space-sm pt-space-xs pb-1 font-label-sm text-label-sm text-outline uppercase tracking-wider">
          {t('nav.administration', 'Administration / प्रशासन')}
        </span>
        {adminItems.map((item) => (
          <NavLink
            key={item.dataPath}
            to={item.to}
            end={item.end}
            data-path={item.dataPath}
            onClick={() => {
              if (isMobile && onClose) onClose()
            }}
            className={({ isActive }) =>
              `flex items-center gap-space-sm px-space-sm py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="font-body-md text-body-md">{item.label}</span>
          </NavLink>
        ))}

        <div className="my-space-xs h-[1px] bg-outline-variant/50" />

        {/* Help & Guidelines */}
        {generalItems.map((item) => (
          <NavLink
            key={item.dataPath}
            to={item.to}
            end={item.end}
            data-path={item.dataPath}
            onClick={() => {
              if (isMobile && onClose) onClose()
            }}
            className={({ isActive }) =>
              `flex items-center gap-space-sm px-space-sm py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="font-body-md text-body-md">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )

  const helpdeskCard = (
    <div className="p-space-sm bg-surface-container m-space-sm rounded-xl">
      <div className="flex items-center gap-2 text-secondary mb-1">
        <span className="material-symbols-outlined text-sm">support_agent</span>
        <span className="font-label-sm text-label-sm uppercase font-bold">
          {t('sidebar.nationalHelpdesk', 'National Helpdesk')}
        </span>
      </div>
      <div className="font-title-sm text-title-sm text-primary">1800-11-7788</div>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {t('sidebar.helpdeskHours', 'Toll Free • 9:30 AM - 6:00 PM')}
      </p>
    </div>
  )

  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col justify-between bg-surface-container-low overflow-y-auto">
        {navContent}
        {helpdeskCard}
      </div>
    )
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 hidden lg:flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
      aria-label="Sidebar Navigation"
    >
      {navContent}
      {helpdeskCard}
    </aside>
  )
}
