import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useAuth } from "../context/AuthContext";
import { useApplications } from "../hooks/useApplications";
import { usePartners, findNearest } from "../hooks/usePartners";
import IndustrialCard from "../components/ui/IndustrialCard";
import TactileButton from "../components/ui/TactileButton";
import LedIndicator from "../components/ui/LedIndicator";
import {
  MapPin,
  Search,
  Crosshair,
  Phone,
  ShieldCheck,
  Building,
  Clock,
  Navigation,
  FileCheck,
  RotateCcw,
} from "lucide-react";

// Fix default Leaflet icon paths in bundler
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// India centroid default coordinates
const INDIA_CENTROID = [22.9, 78.6];
const DEFAULT_ZOOM = 5;

// Custom map marker icon factory with high-contrast badge & status indicator
function createMarkerIcon(type, isEligible, isSelected) {
  const normType = (type || "PSB").toUpperCase();
  const bg =
    normType === "SCA"
      ? "#0b3c5d"
      : normType === "PSB"
        ? "#005323"
        : normType === "RRB"
          ? "#904d00"
          : "#396285";
  const letter =
    normType === "SCA"
      ? "S"
      : normType === "PSB"
        ? "P"
        : normType === "RRB"
          ? "R"
          : "M";
  const ringColor = isSelected ? "#fe932c" : "#ffffff";
  const ringWidth = isSelected ? "3px" : "2px";
  const statusColor = isEligible ? "#15803D" : "#FE932C";

  return L.divIcon({
    className: "custom-partner-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          width: 34px; 
          height: 34px; 
          border-radius: 50%; 
          background-color: ${bg}; 
          border: ${ringWidth} solid ${ringColor}; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.35); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white; 
          font-weight: 700; 
          font-size: 13px;
          font-family: 'Noto Sans', sans-serif;
        ">
          ${letter}
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 6px solid transparent; 
          border-right: 6px solid transparent; 
          border-top: 8px solid ${bg}; 
          margin-top: -2px;
        "></div>
        <div style="
          position: absolute; 
          top: -2px; 
          right: -2px; 
          width: 10px; 
          height: 10px; 
          border-radius: 50%; 
          background-color: ${statusColor}; 
          border: 1.5px solid white;
        "></div>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42],
  });
}

// Helper to determine badge text for partner type
function getPartnerTypeBadge(partner) {
  if (partner.typeBadge) return partner.typeBadge;
  const t = (partner.type || partner.partner_type || "").toUpperCase();
  if (t === "SCA") return "SCA (State Agency)";
  if (t === "PSB") return "PSB (Nationalised Bank)";
  if (t === "RRB") return "RRB (ग्रामीण बैंक)";
  if (t === "NBFC-MFI" || t === "MFI") return "NBFC-MFI (Microfinance)";
  return t || "Partner Desk";
}

// Helper to extract supported schemes list from partner record
function getPartnerSchemes(partner) {
  if (Array.isArray(partner.schemes) && partner.schemes.length > 0) {
    return partner.schemes;
  }
  const types = partner.accepted_scheme_types ?? partner.acceptedSchemeTypes;
  if (Array.isArray(types) && types.length > 0) {
    return types.map((t) => {
      if (typeof t !== "string") return String(t);
      return t
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    });
  }
  if (typeof types === "string") {
    try {
      const parsed = JSON.parse(types);
      if (Array.isArray(parsed)) {
        return parsed.map((t) =>
          typeof t === "string"
            ? t
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
            : String(t),
        );
      }
    } catch {
      return [types];
    }
  }
  return ["Concessional Credit Schemes"];
}

// Partner eligibility status helper
function getPartnerStatus(partner) {
  const isEligible =
    partner?.is_eligible === true || partner?.isEligible === true;
  const res = { status: isEligible ? "accepting" : "limited" };
  Object.defineProperty(res, "isEligible", {
    value: isEligible,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return res;
}

// Map center/zoom controller component
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      Array.isArray(center) &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function LocatorPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const routerState = location.state || {};

  // schemeType comes from router state if the user arrived from the Recommendation Result page
  const schemeType =
    routerState.schemeType ||
    routerState.schemeKey ||
    routerState.scheme?.id ||
    null;

  const auth = useAuth();
  const user = auth?.user;
  const { createApplication } = useApplications(user?.id);

  // Real channel partners from database
  const { partners, loading } = usePartners();

  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [filterType, setFilterType] = useState("all"); // 'all', 'SCA', 'PSB', 'RRB'
  const [onlyActive, setOnlyActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [submittingPartnerId, setSubmittingPartnerId] = useState(null);

  // Distance calculations use only actual browser geolocation.
  const [userCoords, setUserCoords] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [mapCenter, setMapCenter] = useState(INDIA_CENTROID);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  // Fetch browser geolocation on mount.
  useEffect(() => {
    let isMounted = true;

    if (
      typeof navigator !== "undefined" &&
      "geolocation" in navigator &&
      typeof navigator.geolocation?.getCurrentPosition === "function"
    ) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          const uLat = position.coords.latitude;
          const uLng = position.coords.longitude;
          setLocationError("");
          setUserCoords({ lat: uLat, lng: uLng });
          setMapCenter([uLat, uLng]);
          setMapZoom(11);
        },
        (error) => {
          if (!isMounted) return;
          console.warn("Geolocation permission denied or unavailable:", error);
          setUserCoords(null);
          setLocationError(
            "Allow location access to calculate distance from your current position.",
          );
          setMapCenter(INDIA_CENTROID);
          setMapZoom(DEFAULT_ZOOM);
        },
        { timeout: 8000, enableHighAccuracy: true },
      );
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual GPS Auto-Detect trigger
  const handleDetectLocation = () => {
    setIsLocating(true);
    setLocationError("");
    if (
      typeof navigator !== "undefined" &&
      "geolocation" in navigator &&
      typeof navigator.geolocation?.getCurrentPosition === "function"
    ) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const uLat = position.coords.latitude;
          const uLng = position.coords.longitude;
          setUserCoords({ lat: uLat, lng: uLng });
          setMapCenter([uLat, uLng]);
          setMapZoom(12);
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation error/denied:", error);
          setUserCoords(null);
          setLocationError(
            "Allow location access to calculate distance from your current position.",
          );
          setMapCenter(INDIA_CENTROID);
          setMapZoom(DEFAULT_ZOOM);
          setIsLocating(false);
        },
        { timeout: 8000, enableHighAccuracy: true },
      );
    } else {
      setUserCoords(null);
      setLocationError("Location services are unavailable in this browser.");
      setIsLocating(false);
    }
  };

  // Do not calculate a fake distance from India's centroid when GPS is unavailable.
  const effectiveLat = userCoords?.lat ?? null;
  const effectiveLng = userCoords?.lng ?? null;

  // Use findNearest(partners, lat, lng, schemeType)
  // If user arrived from Recommendation Result page, schemeType filters accordingly;
  // Partners are sorted by Haversine distance when actual GPS coordinates exist.
  const nearestPartners = useMemo(() => {
    if (!partners || partners.length === 0) return [];
    return findNearest(partners, effectiveLat, effectiveLng, schemeType);
  }, [partners, effectiveLat, effectiveLng, schemeType]);

  // Filter partners according to type, active status, and search string
  const filteredPartners = useMemo(() => {
    return nearestPartners.filter((p) => {
      const pType = (p.type || p.partner_type || "").toUpperCase();
      // Filter by Type
      if (filterType !== "all" && pType !== filterType.toUpperCase()) {
        return false;
      }
      // Filter by Active Capacity
      const isEligible = p.is_eligible ?? p.isEligible;
      if (onlyActive && !isEligible) {
        return false;
      }
      // Filter by search query if user changed it
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchCity = (p.city || "").toLowerCase().includes(q);
        const matchDistrict = (p.district || "").toLowerCase().includes(q);
        const matchState = (p.state || "").toLowerCase().includes(q);
        const matchType = pType.toLowerCase().includes(q);
        const matchAddress = (p.address || "").toLowerCase().includes(q);
        if (
          !matchName &&
          !matchCity &&
          !matchDistrict &&
          !matchState &&
          !matchType &&
          !matchAddress
        ) {
          return false;
        }
      }
      return true;
    });
  }, [nearestPartners, filterType, onlyActive, searchQuery]);

  // Derive currently selected partner
  const selectedPartner = useMemo(() => {
    if (filteredPartners.length === 0) return null;
    if (selectedPartnerId) {
      const matched = filteredPartners.find((p) => p.id === selectedPartnerId);
      if (matched) return matched;
    }
    return filteredPartners[0];
  }, [filteredPartners, selectedPartnerId]);

  // Counts for filter chips
  const counts = useMemo(() => {
    return {
      all: nearestPartners.length,
      sca: nearestPartners.filter(
        (p) => (p.type || p.partner_type || "").toUpperCase() === "SCA",
      ).length,
      psb: nearestPartners.filter(
        (p) => (p.type || p.partner_type || "").toUpperCase() === "PSB",
      ).length,
      rrb: nearestPartners.filter(
        (p) => (p.type || p.partner_type || "").toUpperCase() === "RRB",
      ).length,
    };
  }, [nearestPartners]);

  // Handle selecting a partner and focusing on the map
  const handlePartnerSelect = (partner) => {
    setSelectedPartnerId(partner.id);
    const pLat = parseFloat(partner.lat ?? partner.latitude);
    const pLng = parseFloat(partner.lng ?? partner.longitude);
    if (!isNaN(pLat) && !isNaN(pLng)) {
      setMapCenter([pLat, pLng]);
      setMapZoom(13);
    }
  };

  // "Start application here" calls createApplication using scheme/answers from router state, then navigates to /applications
  const handleStartApplication = async (partner) => {
    if (!partner?.id) return;
    setSubmittingPartnerId(partner.id);

    try {
      const schemeId =
        routerState.schemeId ||
        routerState.scheme_id ||
        routerState.scheme?.id ||
        routerState.result?.schemeId ||
        routerState.result?.schemeKey ||
        routerState.schemeType ||
        "term_loan";

      const answers = routerState.answers || {};

      await createApplication({
        partnerId: partner.id,
        schemeId,
        ...answers,
        ...(routerState.scheme ? { scheme: routerState.scheme } : {}),
      });
    } catch (err) {
      console.error("Error creating application from locator:", err);
    } finally {
      setSubmittingPartnerId(null);
      navigate("/applications");
    }
  };

  return (
    <div className="w-full py-6 px-4 md:px-6 lg:px-8 flex flex-col gap-6 text-left">
      {/* Top Header Card with Search & Filters */}
      <IndustrialCard
        cornerScrews={true}
        ventSlots={true}
        className="p-6 flex flex-col gap-5 text-left"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-mono text-xs text-ink-muted">
              <LedIndicator status="active" size="sm" pulse />
              <span className="font-semibold uppercase tracking-wider">
                Accredited Channel Network // आधिकारिक चैनल पार्टनर खोजक
              </span>
            </div>
            <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-ink uppercase">
              Channel Partner Radar (शाखा खोजक)
            </h1>
            <p className="font-sans text-xs md:text-sm text-ink-muted max-w-3xl leading-relaxed mt-1">
              Connect directly with accredited Government Channelising Agencies
              (SCAs), Public Sector Banks (PSBs), and Regional Rural Banks
              (RRBs) handling loan disbursement and subsidy processing.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-recessed shadow-recessed px-3.5 py-1.5 rounded-lg border border-chassis-dark/25 font-mono text-xs">
            <LedIndicator
              status={loading ? "warning" : "success"}
              size="sm"
              pulse={loading}
            />
            <span className="font-bold text-ink uppercase">
              {loading
                ? "CALIBRATING RADAR..."
                : `${filteredPartners.length} DESKS FOUND`}
            </span>
          </div>
        </div>

        {/* Search bar and Active Capacity switch */}
        <div className="flex flex-wrap items-center gap-4 pt-1 font-mono">
          <div className="flex-1 min-w-[280px] relative">
            <div className="flex items-stretch bg-recessed shadow-recessed rounded-lg overflow-hidden border border-chassis-dark/40 focus-within:ring-2 focus-within:ring-accent">
              <span className="inline-flex items-center justify-center px-3.5 text-ink-muted border-r border-chassis-dark/30">
                <Search className="w-4 h-4" />
              </span>
              <input
                className="w-full bg-transparent px-3 py-2.5 font-mono text-xs md:text-sm text-ink outline-none placeholder:text-ink-muted/50 font-medium"
                id="geoSearchInput"
                placeholder="Search by District, City, or 6-digit PIN..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <TactileButton
                variant="secondary"
                size="sm"
                className="m-1 text-xs shrink-0"
                id="detectLocationBtn"
                title="Auto-detect via GPS"
                type="button"
                onClick={handleDetectLocation}
              >
                <Crosshair
                  className={`w-3.5 h-3.5 mr-1 text-accent ${isLocating ? "animate-spin" : ""}`}
                />
                <span>{isLocating ? "Locating..." : "GPS Auto-Detect"}</span>
              </TactileButton>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-panel p-2 rounded-lg border border-chassis-dark/20 shadow-card">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="sr-only peer"
                id="activeCapacityToggle"
                type="checkbox"
              />
              <div className="w-10 h-5 bg-recessed shadow-recessed rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent border border-chassis-dark/30"></div>
              <span className="ml-2.5 font-mono text-xs font-semibold text-ink">
                Active counters only (सक्रिय)
              </span>
            </label>
          </div>
        </div>

        {locationError && (
          <p className="font-mono text-xs text-accent" role="status">
            {locationError} Imported Maharashtra banks use fixed distances from
            Kharghar Railway Station.
          </p>
        )}

        {/* Filter Buttons */}
        <div
          className="flex flex-wrap gap-2 pt-1 font-mono text-xs"
          id="filterChips"
        >
          {[
            { id: "all", label: `ALL CHANNELS (${counts.all})` },
            { id: "SCA", label: `STATE CHANNELISING (${counts.sca})` },
            { id: "PSB", label: `PUBLIC SECTOR BANKS (${counts.psb})` },
            { id: "RRB", label: `REGIONAL RURAL (${counts.rrb})` },
          ].map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <TactileButton
                key={tab.id}
                variant={isActive ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilterType(tab.id)}
                className="text-xs"
              >
                {tab.label}
              </TactileButton>
            );
          })}
        </div>
      </IndustrialCard>

      {/* Two Columns: Beside the map, a scrollable list panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scrollable list panel mirroring partner data */}
        <div className="lg:col-span-5 flex flex-col gap-4 max-h-[820px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-ink-muted px-1 font-mono text-xs">
            <span className="uppercase tracking-wider font-bold text-ink">
              Nearby Partner Branches (शाखाएँ)
            </span>
            <span className="text-[11px]">
              {loading
                ? "CALIBRATING..."
                : `${filteredPartners.length} AVAILABLE`}
            </span>
          </div>

          {/* Skeleton list while loading (3 pulsing cards) */}
          {loading ? (
            <div
              className="flex flex-col gap-4"
              role="status"
              aria-label="Loading partner branches"
            >
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="animate-pulse flex flex-col bg-panel p-4 rounded-xl border border-chassis-dark/20 gap-3 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-5 w-24 bg-recessed rounded" />
                    <div className="h-5 w-32 bg-recessed rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-chassis-dark/30 rounded mt-1" />
                  <div className="h-4 w-1/2 bg-recessed rounded" />
                  <div className="h-12 w-full bg-recessed rounded-lg mt-1" />
                  <div className="h-9 w-full bg-recessed rounded-lg mt-2" />
                </div>
              ))}
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="p-8 text-center bg-panel rounded-xl border border-chassis-dark/20 shadow-card">
              <Building className="w-10 h-10 text-ink-muted mx-auto mb-2 opacity-50" />
              <p className="font-mono text-sm font-bold text-ink uppercase">
                No partners found matching parameters
              </p>
              <p className="font-sans text-xs text-ink-muted mt-1">
                Try disabling active capacity filters or broadening your search
                query.
              </p>
            </div>
          ) : (
            filteredPartners.map((partner) => {
              const isSelected = selectedPartner?.id === partner.id;
              const typeBadge = getPartnerTypeBadge(partner);
              const status = getPartnerStatus(partner);
              const schemes = getPartnerSchemes(partner);
              const locationLabel =
                partner.location ||
                [partner.city, partner.state].filter(Boolean).join(", ") ||
                partner.address;
              const distanceDisplay =
                partner.distanceKm != null
                  ? `${Number(partner.distanceKm).toFixed(0)} km from ${partner.distanceReference || "your location"}`
                  : "";
              const deskDisplay = partner.desk || "Nodal Credit Officer";
              const isSubmitting = submittingPartnerId === partner.id;

              return (
                <div
                  key={partner.id}
                  onClick={() => handlePartnerSelect(partner)}
                  className={`partner-card flex flex-col p-4 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-chassis shadow-pressed border-accent ring-1 ring-accent translate-y-[1px]"
                      : "bg-panel shadow-card hover:shadow-floating hover:-translate-y-0.5 border-chassis-dark/20 text-ink"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2 font-mono">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-chassis border border-chassis-dark/30 text-ink">
                      {typeBadge}
                    </span>

                    <LedIndicator
                      status={status.isEligible ? "success" : "warning"}
                      label={t(`locator.status.${status.status}.badge`)}
                      size="sm"
                    />
                  </div>

                  <h2 className="font-mono text-sm font-bold text-ink uppercase leading-snug">
                    {partner.name}
                  </h2>
                  <span className="font-sans text-xs text-ink-muted mt-0.5">
                    {locationLabel}
                  </span>

                  <div className="flex items-center gap-1.5 text-accent font-mono text-xs mt-1 mb-2.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {distanceDisplay ? `${distanceDisplay} • ` : ""}
                      {partner.address}
                    </span>
                  </div>

                  <div className="bg-recessed shadow-recessed p-2.5 rounded-lg mb-3 flex flex-col gap-1 border border-chassis-dark/20 font-mono">
                    <div className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">
                      Supported Central Schemes:
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px] text-ink font-semibold">
                      {schemes.map((scheme, idx) => (
                        <span
                          key={idx}
                          className="bg-panel px-2 py-0.5 rounded shadow-xs border border-chassis-dark/20"
                        >
                          {scheme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 mb-3 text-ink-muted font-mono text-[11px]">
                    <div className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-accent" />
                      <span>
                        Desk:{" "}
                        <strong className="text-ink">{deskDisplay}</strong>
                      </span>
                    </div>
                    <span
                      className={
                        status.isEligible
                          ? "text-emerald-700 font-bold"
                          : "text-accent font-bold"
                      }
                    >
                      {t(`locator.status.${status.status}.detail`)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <TactileButton
                      variant={status.isEligible ? "primary" : "secondary"}
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={isSubmitting}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartApplication(partner);
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                          <span>SUBMITTING...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-3.5 h-3.5 mr-1" />
                          <span>Start Application Here</span>
                        </>
                      )}
                    </TactileButton>

                    <TactileButton
                      variant="secondary"
                      size="sm"
                      className="px-2.5 text-xs shrink-0"
                      title="Call Branch Helpline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (partner.phone) {
                          window.location.href = `tel:${partner.phone}`;
                        }
                      }}
                    >
                      <Phone className="w-3.5 h-3.5 text-accent" />
                    </TactileButton>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Map Column */}
        <div className="lg:col-span-7 flex flex-col gap-space-sm sticky top-24">
          <div className="relative w-full h-[620px] rounded-xl overflow-hidden shadow-lg bg-surface-container-high border border-outline-variant/40">
            <MapContainer
              center={INDIA_CENTROID}
              zoom={DEFAULT_ZOOM}
              scrollWheelZoom={true}
              className="w-full h-full"
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapViewController center={mapCenter} zoom={mapZoom} />

              {/* Only render markers when partners have finished loading */}
              {!loading &&
                filteredPartners.map((partner) => {
                  const pLat = parseFloat(partner.lat ?? partner.latitude);
                  const pLng = parseFloat(partner.lng ?? partner.longitude);
                  if (isNaN(pLat) || isNaN(pLng)) return null;

                  const isSelected = selectedPartner?.id === partner.id;
                  const partnerType =
                    partner.type || partner.partner_type || "PSB";
                  const typeBadge = getPartnerTypeBadge(partner);
                  const status = getPartnerStatus(partner);
                  const distanceDisplay =
                    partner.distanceKm != null
                      ? `${Number(partner.distanceKm).toFixed(0)} km from ${partner.distanceReference || "your location"}`
                      : "Nearby";
                  const isSubmitting = submittingPartnerId === partner.id;

                  return (
                    <Marker
                      key={partner.id}
                      position={[pLat, pLng]}
                      icon={createMarkerIcon(
                        partnerType,
                        status.isEligible,
                        isSelected,
                      )}
                      eventHandlers={{
                        click: () => {
                          handlePartnerSelect(partner);
                        },
                      }}
                    >
                      <Popup className="partner-popup">
                        <div className="p-1 min-w-[240px] max-w-[280px] text-left font-sans">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-surface-container-highest text-primary">
                              {typeBadge}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                status.isEligible
                                  ? "bg-[#DCFCE7] text-[#14532D]"
                                  : "bg-[#FEF3C7] text-[#78350F]"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  status.isEligible
                                    ? "bg-[#15803D]"
                                    : "bg-[#B45309]"
                                }`}
                              ></span>
                              {t(`locator.status.${status.status}.badge`)}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-primary leading-snug mb-1">
                            {partner.name}
                          </h3>
                          <p className="text-xs text-on-surface-variant mb-2">
                            {partner.address}
                          </p>
                          <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant/30 mb-2.5">
                            <span>{distanceDisplay}</span>
                            <span
                              className={
                                status.isEligible
                                  ? "text-tertiary font-bold"
                                  : "text-secondary font-bold"
                              }
                            >
                              {t(`locator.status.${status.status}.detail`)}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            className="w-full py-1.5 px-3 rounded bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all duration-200 text-center cursor-pointer disabled:opacity-60"
                            onClick={() => handleStartApplication(partner)}
                          >
                            {isSubmitting
                              ? "Routing..."
                              : "Start application here"}
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>

            {/* Marker Classification Legend Overlay */}
            <div className="absolute top-4 left-4 z-[400] flex flex-col gap-1.5 bg-panel/95 shadow-card backdrop-blur-md p-3 rounded-lg font-mono text-xs border border-chassis-dark/30 pointer-events-auto">
              <span className="font-bold text-ink uppercase tracking-wider text-[11px]">
                Classification (संकेत):
              </span>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#0b3c5d] flex items-center justify-center text-[10px] text-white font-bold">
                  S
                </span>
                <span className="text-ink font-medium text-[11px]">
                  State Agency (SCA)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#005323] flex items-center justify-center text-[10px] text-white font-bold">
                  P
                </span>
                <span className="text-ink font-medium text-[11px]">
                  Public Sector (PSB)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#904d00] flex items-center justify-center text-[10px] text-white font-bold">
                  R
                </span>
                <span className="text-ink font-medium text-[11px]">
                  Regional Rural (RRB)
                </span>
              </div>
            </div>

            {/* Reset view button */}
            <div className="absolute top-4 right-4 z-[400] pointer-events-auto">
              <TactileButton
                variant="secondary"
                size="sm"
                className="text-xs"
                title="Reset to All India Centroid"
                onClick={() => {
                  setMapCenter(INDIA_CENTROID);
                  setMapZoom(DEFAULT_ZOOM);
                }}
              >
                <RotateCcw className="w-3 h-3 mr-1 text-accent" />
                <span>India View</span>
              </TactileButton>
            </div>

            {/* Selected Branch Detail Bottom Floating Card (Only rendered when not loading) */}
            {!loading && selectedPartner && (
              <div className="absolute bottom-4 left-4 right-4 z-[400] bg-panel/95 shadow-floating backdrop-blur-md p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-chassis-dark/30 pointer-events-auto">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chassis shadow-pressed flex items-center justify-center text-accent shrink-0 border border-chassis-dark/25">
                    <Building className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 font-mono">
                      <span className="text-xs font-bold text-ink uppercase">
                        {selectedPartner.name}
                      </span>
                      {(() => {
                        const status = getPartnerStatus(selectedPartner);
                        return (
                          <LedIndicator
                            status={status.isEligible ? "success" : "warning"}
                            label={t(`locator.status.${status.status}.badge`)}
                            size="sm"
                          />
                        );
                      })()}
                    </div>
                    <p className="font-sans text-xs text-ink-muted mt-0.5">
                      {selectedPartner.address}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-ink-muted font-mono text-[11px]">
                      {selectedPartner.distanceKm != null && (
                        <span className="flex items-center gap-1 font-bold text-accent">
                          <MapPin className="w-3 h-3" />
                          {Number(selectedPartner.distanceKm).toFixed(0)} km
                          from{" "}
                          {selectedPartner.distanceReference || "your location"}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-ink-muted" />
                        Hours: {selectedPartner.hours || "10:00 AM - 4:00 PM"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-ink-muted" />
                        Helpline: {selectedPartner.phone || "1800-11-7788"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto font-mono">
                  <TactileButton
                    variant="primary"
                    size="sm"
                    className="flex-1 md:flex-none text-xs"
                    disabled={submittingPartnerId === selectedPartner.id}
                    onClick={() => handleStartApplication(selectedPartner)}
                  >
                    {submittingPartnerId === selectedPartner.id
                      ? "Routing..."
                      : "Start Application Here"}
                  </TactileButton>
                  <TactileButton
                    variant="secondary"
                    size="sm"
                    className="px-2.5 text-xs"
                    title="Center Map on Branch"
                    onClick={() => {
                      const pLat = parseFloat(
                        selectedPartner.lat ?? selectedPartner.latitude,
                      );
                      const pLng = parseFloat(
                        selectedPartner.lng ?? selectedPartner.longitude,
                      );
                      if (!isNaN(pLat) && !isNaN(pLng)) {
                        setMapCenter([pLat, pLng]);
                        setMapZoom(14);
                      }
                    }}
                  >
                    <Navigation className="w-3.5 h-3.5 text-accent" />
                  </TactileButton>
                </div>
              </div>
            )}
          </div>

          {/* 3 Trust Assurances below map */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
            <div className="bg-panel p-3.5 rounded-lg shadow-card border border-chassis-dark/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-ink font-bold uppercase">
                  Direct Verification
                </span>
                <span className="text-[11px] text-ink-muted">
                  Paperless biometric checks
                </span>
              </div>
            </div>
            <div className="bg-panel p-3.5 rounded-lg shadow-card border border-chassis-dark/20 flex items-center gap-3">
              <Building className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-ink font-bold uppercase">
                  No Intermediaries
                </span>
                <span className="text-[11px] text-ink-muted">
                  Direct credit guarantee desk
                </span>
              </div>
            </div>
            <div className="bg-panel p-3.5 rounded-lg shadow-card border border-chassis-dark/20 flex items-center gap-3">
              <Phone className="w-5 h-5 text-accent shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-ink font-bold uppercase">
                  Helpdesk Assist
                </span>
                <span className="text-[11px] text-ink-muted">
                  Dedicated Nodal Desk Officer
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Chassis Footer */}
      <footer className="w-full bg-panel shadow-card border border-chassis-dark/20 py-3 px-6 rounded-xl font-mono text-xs text-ink-muted mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            Official portal of the Ministry of Social Justice & Empowerment •
            Government of India // Locator Grid
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Certified Partner Network
            </span>
            <span>Helpline: 1800-11-7788</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
