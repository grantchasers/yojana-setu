/**
 * TactileButton - Industrial Physical Key
 * Children are rendered as flex items (not truncated wrappers) so spinners
 * and success icons stay visible during loading/success states.
 */
export default function TactileButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon: Icon,
  iconRight: IconRight,
  type = 'button',
  ...props
}) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold tracking-wider uppercase select-none transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-chassis'

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md min-h-[36px] gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-lg min-h-[44px] gap-2',
    lg: 'px-6 py-3.5 text-base rounded-xl min-h-[52px] gap-2.5',
    icon: 'p-2.5 w-11 h-11 rounded-lg gap-0',
    'icon-sm': 'p-1.5 w-8 h-8 rounded-md gap-0',
    'icon-lg': 'p-3 w-14 h-14 rounded-xl gap-0',
  }

  const variantStyles = {
    primary:
      'bg-accent text-accent-foreground border border-white/20 shadow-btn-primary hover:brightness-110 active:translate-y-[2px] active:shadow-[inset_4px_4px_8px_rgba(166,50,60,0.5),inset_-4px_-4px_8px_rgba(255,120,130,0.5)]',
    secondary:
      'bg-chassis text-ink border border-white/60 shadow-card hover:text-accent hover:shadow-floating active:translate-y-[2px] active:shadow-pressed',
    recessed:
      'bg-chassis text-accent shadow-pressed border border-industrial-border-shadow/20 font-bold',
    ghost:
      'bg-transparent text-ink-muted hover:bg-panel hover:text-ink active:translate-y-[1px] active:shadow-recessed',
    danger:
      'bg-[#dc2626] text-white border border-white/20 shadow-btn-primary hover:brightness-110 active:translate-y-[2px] active:shadow-pressed',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />}
      {children}
      {IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </button>
  )
}
