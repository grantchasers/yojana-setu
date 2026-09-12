/**
 * IndustrialCard - Bolted Module Component
 * Features:
 * - Dual neumorphic shadow elevation
 * - Precision corner screw indentations at 12px from edges
 * - Optional ventilation slots (3 vertical recessed pills)
 * - Optional punched hanging hole (for tag/badge realism)
 * - Tactile hover lift physics
 */
export default function IndustrialCard({
  children,
  className = "",
  cornerScrews = true,
  ventSlots = false,
  punchedHole = false,
  elevated = false,
  interactive = false,
  darkPanel = false,
  as: Component = "div",
  ...props
}) {
  const baseShadow = elevated ? "shadow-floating" : "shadow-card";
  const hoverPhysics = interactive
    ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-floating cursor-pointer"
    : "transition-shadow duration-300";

  const bgStyle = darkPanel
    ? "bg-[#112250] text-[#f5f0e9] border border-white/10"
    : "bg-chassis text-ink border border-white/50";

  return (
    <Component
      className={`relative rounded-xl ${bgStyle} ${baseShadow} ${hoverPhysics} ${
        cornerScrews ? "corner-screws" : ""
      } ${className}`}
      {...props}
    >
      {/* Top Punched Hanging Hole for Tag Aesthetics */}
      {punchedHole && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-chassis border-2 border-industrial-border-shadow/40 shadow-recessed flex items-center justify-center pointer-events-none z-20">
          <div className="w-2.5 h-2.5 rounded-full bg-industrial-border-dark/40 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4)]" />
        </div>
      )}

      {/* Top-Right Ventilation Slots */}
      {ventSlots && (
        <div className="absolute top-3.5 right-4 flex items-center gap-1.5 pointer-events-none z-10">
          <div className="vent-slot" />
          <div className="vent-slot" />
          <div className="vent-slot" />
        </div>
      )}

      {children}
    </Component>
  );
}
