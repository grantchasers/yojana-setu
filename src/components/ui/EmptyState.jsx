import { useTranslation } from 'react-i18next'

/**
 * Reusable empty state component with Material Symbols icon, centered layout,
 * and support for localized text via i18next or direct string/node values.
 *
 * @param {Object} props
 * @param {string|React.ReactNode} [props.icon='inbox'] - Material Symbols icon identifier or custom node
 * @param {string|React.ReactNode} props.title - Main title or translation key
 * @param {string|React.ReactNode} [props.subtitle] - Supporting subtitle description or translation key
 * @param {string|React.ReactNode} [props.ctaLabel] - Optional call-to-action button label or translation key
 * @param {Function} [props.onCta] - Click handler for the CTA button
 * @param {string} [props.className] - Optional extra Tailwind class names
 * @param {React.ReactNode} [props.children] - Optional custom children
 */
export function EmptyState({
  icon = 'inbox',
  title,
  subtitle,
  ctaLabel,
  onCta,
  className = '',
  children,
  ...props
}) {
  const { t } = useTranslation()

  const renderedTitle = typeof title === 'string' ? t(title) : title
  const renderedSubtitle = typeof subtitle === 'string' ? t(subtitle) : subtitle
  const renderedCtaLabel = typeof ctaLabel === 'string' ? t(ctaLabel) : ctaLabel

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs ${className}`.trim()}
      {...props}
    >
      {icon && (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-fixed/50 text-primary flex items-center justify-center mb-space-md shadow-xs">
          {typeof icon === 'string' ? (
            <span className="material-symbols-outlined text-3xl sm:text-4xl" aria-hidden="true">
              {icon}
            </span>
          ) : (
            icon
          )}
        </div>
      )}

      {renderedTitle && (
        <h3 className="font-headline-sm text-headline-sm sm:font-headline-md sm:text-headline-md text-primary font-bold mb-2">
          {renderedTitle}
        </h3>
      )}

      {renderedSubtitle && (
        <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mb-space-lg">
          {renderedSubtitle}
        </p>
      )}

      {renderedCtaLabel && (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center gap-2 px-space-xl py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all duration-200 cursor-pointer"
        >
          <span>{renderedCtaLabel}</span>
        </button>
      )}

      {children}
    </div>
  )
}

export default EmptyState
