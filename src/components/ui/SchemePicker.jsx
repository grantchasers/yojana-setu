import { CheckCircle2, Award } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Horizontal, snap-scrolling scheme selector with a distinct selected/pressed state.
 */
export default function SchemePicker({
  schemes = [],
  selectedId,
  recommendedId,
  onSelect,
  className = "",
}) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith("hi");
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
            Scheme Bank // वैकल्पिक योजना
          </p>
          <h3 className="font-mono text-sm font-bold uppercase text-ink tracking-tight">
            Browse & select a credit window
          </h3>
        </div>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wider bg-panel px-2 py-1 rounded border border-chassis-dark/20">
          {schemes.length} schemes available
        </span>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-2"
        role="listbox"
        aria-label="Available schemes"
      >
        {schemes.map((scheme) => {
          const id = scheme.id || scheme.schemeKey;
          const selected = selectedId === id;
          const recommended = recommendedId === id;
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect?.(id, scheme)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                selected
                  ? "bg-chassis shadow-pressed border-accent ring-2 ring-accent/70 translate-y-[1px]"
                  : "bg-panel shadow-card border-chassis-dark/20 hover:-translate-y-1 hover:shadow-floating"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  {scheme.code || scheme.agency || "MoSJE"}
                </span>
                <span className="flex items-center gap-1">
                  {recommended && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent text-white font-mono text-[9px] font-bold uppercase">
                      <Award className="w-3 h-3" /> Top
                    </span>
                  )}
                  {selected && (
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  )}
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-ink uppercase leading-snug">
                {(isHindi &&
                  (scheme.titleHi ||
                    scheme.name_hi ||
                    scheme.scheme_name_hi)) ||
                  scheme.title ||
                  scheme.name ||
                  scheme.schemeName}
              </p>
              <p className="font-sans text-[11px] text-ink-muted mt-1 line-clamp-2">
                {(isHindi && (scheme.descriptionHi || scheme.description_hi)) ||
                  scheme.description ||
                  scheme.titleHi ||
                  "रियायती MoSJE ऋण योजना"}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-chassis-dark/15 font-mono text-[11px]">
                <span className="text-accent font-bold">
                  {scheme.interestRate || "4% – 6%"}
                </span>
                <span className="text-ink-muted">
                  {scheme.maxAmountFormatted || "Up to ceiling"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <label className="block mt-3 font-mono text-xs font-bold text-ink">
        Select any available scheme / कोई भी योजना चुनें
        <select
          className="mt-1 w-full h-11 px-3 rounded-lg bg-recessed border border-chassis-dark/30 font-mono text-xs"
          value={selectedId || ""}
          onChange={(event) => onSelect?.(event.target.value)}
        >
          <option value="">Choose a scheme</option>
          {schemes.map((scheme) => {
            const id = scheme.id || scheme.schemeKey;
            return (
              <option key={id} value={id}>
                {scheme.title || scheme.name || scheme.schemeName || id}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}
