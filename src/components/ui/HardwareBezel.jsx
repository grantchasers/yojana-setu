/**
 * HardwareBezel - CRT Screen / Technical Bezel Display
 * Features:
 * - Recessed dark chassis bezel with scanlines
 * - Inset shadow for depth below chassis surface
 * - Mechanical corner radius and status indicator mounts
 */
export default function HardwareBezel({
  children,
  className = "",
  title,
  indicatorColor = "green",
  statusLed,
  scanlines = true,
  statusText,
}) {
  const led =
    indicatorColor ||
    (statusLed === "success"
      ? "green"
      : statusLed === "error"
        ? "orange"
        : "green");
  return (
    <div
      className={`relative rounded-2xl bg-[#112250] border-4 border-[#3c5070] shadow-[inset_0_4px_12px_rgba(17,34,80,0.8),0_4px_12px_rgba(17,34,80,0.15)] overflow-hidden ${className}`}
    >
      {/* Header bar on bezel */}
      {(title || statusText) && (
        <div className="px-4 py-2 bg-[#161a1f] border-b border-white/5 flex items-center justify-between text-xs text-white/70 font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${led === "green" ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-accent shadow-[0_0_6px_#e0c58f]"} animate-pulse`}
            />
            <span className="font-bold tracking-wider uppercase text-white/90">
              {title}
            </span>
          </div>
          {statusText && (
            <span className="text-[10px] text-white/50 tracking-widest uppercase">
              {statusText}
            </span>
          )}
        </div>
      )}

      {/* Screen interior with optional CRT scanlines */}
      <div
        className={`relative p-4 md:p-6 text-white ${scanlines ? "crt-scanlines" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
