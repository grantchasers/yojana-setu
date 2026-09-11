import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../context/AuthContext'
import { useApplications } from '../hooks/useApplications'
import { usePartners, findNearest } from '../hooks/usePartners'

// Fix default Leaflet icon paths in bundler
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

// India centroid default coordinates
const INDIA_CENTROID = [22.9, 78.6]
const DEFAULT_ZOOM = 5

// Custom map marker icon factory with high-contrast badge & status indicator
function createMarkerIcon(type, isEligible, isSelected) {
  const normType = (type || 'PSB').toUpperCase()
  const bg = normType === 'SCA' ? '#0b3c5d' : normType === 'PSB' ? '#005323' : normType === 'RRB' ? '#904d00' : '#396285'
  const letter = normType === 'SCA' ? 'S' : normType === 'PSB' ? 'P' : normType === 'RRB' ? 'R' : 'M'
  const ringColor = isSelected ? '#fe932c' : '#ffffff'
  const ringWidth = isSelected ? '3px' : '2px'
  const statusColor = isEligible ? '#15803D' : '#FE932C'

  return L.divIcon({
    className: 'custom-partner-marker',
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
  })
}

// Helper to determine badge text for partner type
function getPartnerTypeBadge(partner) {
  if (partner.typeBadge) return partner.typeBadge
  const t = (partner.type || partner.partner_type || '').toUpperCase()
  if (t === 'SCA') return 'SCA (State Agency)'
  if (t === 'PSB') return 'PSB (Nationalised Bank)'
  if (t === 'RRB') return 'RRB (ग्रामीण बैंक)'
  if (t === 'NBFC-MFI' || t === 'MFI') return 'NBFC-MFI (Microfinance)'
  return t || 'Partner Desk'
}

// Helper to extract supported schemes list from partner record
function getPartnerSchemes(partner) {
  if (Array.isArray(partner.schemes) && partner.schemes.length > 0) {
    return partner.schemes
  }
  const types = partner.accepted_scheme_types ?? partner.acceptedSchemeTypes
  if (Array.isArray(types) && types.length > 0) {
    return types.map((t) => {
      if (typeof t !== 'string') return String(t)
      return t
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    })
  }
  if (typeof types === 'string') {
    try {
      const parsed = JSON.parse(types)
      if (Array.isArray(parsed)) {
        return parsed.map((t) =>
          typeof t === 'string'
            ? t.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            : String(t)
        )
      }
    } catch {
      return [types]
    }
  }
  return ['Concessional Credit Schemes']
}

// Partner eligibility status helper
function getPartnerStatus(partner) {
  const isEligible = partner?.is_eligible === true || partner?.isEligible === true
  const res = { status: isEligible ? 'accepting' : 'limited' }
  Object.defineProperty(res, 'isEligible', {
    value: isEligible,
    enumerable: false,
    writable: true,
    configurable: true,
  })
  return res
}

// Map center/zoom controller component
function MapViewController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (
      center &&
      Array.isArray(center) &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

export default function LocatorPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const routerState = location.state || {}

  // schemeType comes from router state if the user arrived from the Recommendation Result page
  const schemeType =
    routerState.schemeType ||
    routerState.schemeKey ||
    routerState.scheme?.id ||
    null

  const auth = useAuth()
  const user = auth?.user
  const { createApplication } = useApplications(user?.id)

  // Real channel partners from database
  const { partners, loading } = usePartners()

  const [selectedPartnerId, setSelectedPartnerId] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all', 'SCA', 'PSB', 'RRB'
  const [onlyActive, setOnlyActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const [submittingPartnerId, setSubmittingPartnerId] = useState(null)

  // Coordinates from browser geolocation or fallback India centroid
  const [userCoords, setUserCoords] = useState(null)
  const [mapCenter, setMapCenter] = useState(INDIA_CENTROID)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)

  // Fetch browser geolocation on mount with graceful fallback to India centroid
  useEffect(() => {
    let isMounted = true

    if (
      typeof navigator !== 'undefined' &&
      'geolocation' in navigator &&
      typeof navigator.geolocation?.getCurrentPosition === 'function'
    ) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return
          const uLat = position.coords.latitude
          const uLng = position.coords.longitude
          setUserCoords({ lat: uLat, lng: uLng })
          setMapCenter([uLat, uLng])
          setMapZoom(11)
        },
        (error) => {
          if (!isMounted) return
          console.warn(
            'Geolocation permission denied or unavailable, falling back to India centroid:',
            error
          )
          setUserCoords({ lat: INDIA_CENTROID[0], lng: INDIA_CENTROID[1] })
          setMapCenter(INDIA_CENTROID)
          setMapZoom(DEFAULT_ZOOM)
        },
        { timeout: 8000, enableHighAccuracy: true }
      )
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Manual GPS Auto-Detect trigger
  const handleDetectLocation = () => {
    setIsLocating(true)
    if (
      typeof navigator !== 'undefined' &&
      'geolocation' in navigator &&
      typeof navigator.geolocation?.getCurrentPosition === 'function'
    ) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const uLat = position.coords.latitude
          const uLng = position.coords.longitude
          setUserCoords({ lat: uLat, lng: uLng })
          setMapCenter([uLat, uLng])
          setMapZoom(12)
          setIsLocating(false)
        },
        (error) => {
          console.warn('Geolocation error/denied, falling back to India centroid:', error)
          setUserCoords({ lat: INDIA_CENTROID[0], lng: INDIA_CENTROID[1] })
          setMapCenter(INDIA_CENTROID)
          setMapZoom(DEFAULT_ZOOM)
          setIsLocating(false)
        },
        { timeout: 8000, enableHighAccuracy: true }
      )
    } else {
      setUserCoords({ lat: INDIA_CENTROID[0], lng: INDIA_CENTROID[1] })
      setMapCenter(INDIA_CENTROID)
      setMapZoom(DEFAULT_ZOOM)
      setIsLocating(false)
    }
  }

  // Active lat/lng: detected user location or graceful fallback India centroid
  const effectiveLat = userCoords?.lat ?? INDIA_CENTROID[0]
  const effectiveLng = userCoords?.lng ?? INDIA_CENTROID[1]

  // Use findNearest(partners, lat, lng, schemeType)
  // If user arrived from Recommendation Result page, schemeType filters accordingly;
  // else findNearest shows all eligible partners sorted by distance from fallback/detected location
  const nearestPartners = useMemo(() => {
    if (!partners || partners.length === 0) return []
    return findNearest(partners, effectiveLat, effectiveLng, schemeType)
  }, [partners, effectiveLat, effectiveLng, schemeType])

  // Filter partners according to type, active status, and search string
  const filteredPartners = useMemo(() => {
    return nearestPartners.filter((p) => {
      const pType = (p.type || p.partner_type || '').toUpperCase()
      // Filter by Type
      if (filterType !== 'all' && pType !== filterType.toUpperCase()) {
        return false
      }
      // Filter by Active Capacity
      const isEligible = p.is_eligible ?? p.isEligible
      if (onlyActive && !isEligible) {
        return false
      }
      // Filter by search query if user changed it
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (p.name || '').toLowerCase().includes(q)
        const matchCity = (p.city || '').toLowerCase().includes(q)
        const matchDistrict = (p.district || '').toLowerCase().includes(q)
        const matchState = (p.state || '').toLowerCase().includes(q)
        const matchType = pType.toLowerCase().includes(q)
        const matchAddress = (p.address || '').toLowerCase().includes(q)
        if (!matchName && !matchCity && !matchDistrict && !matchState && !matchType && !matchAddress) {
          return false
        }
      }
      return true
    })
  }, [nearestPartners, filterType, onlyActive, searchQuery])

  // Derive currently selected partner
  const selectedPartner = useMemo(() => {
    if (filteredPartners.length === 0) return null
    if (selectedPartnerId) {
      const matched = filteredPartners.find((p) => p.id === selectedPartnerId)
      if (matched) return matched
    }
    return filteredPartners[0]
  }, [filteredPartners, selectedPartnerId])

  // Counts for filter chips
  const counts = useMemo(() => {
    return {
      all: nearestPartners.length,
      sca: nearestPartners.filter((p) => (p.type || p.partner_type || '').toUpperCase() === 'SCA').length,
      psb: nearestPartners.filter((p) => (p.type || p.partner_type || '').toUpperCase() === 'PSB').length,
      rrb: nearestPartners.filter((p) => (p.type || p.partner_type || '').toUpperCase() === 'RRB').length,
    }
  }, [nearestPartners])

  // Handle selecting a partner and focusing on the map
  const handlePartnerSelect = (partner) => {
    setSelectedPartnerId(partner.id)
    const pLat = parseFloat(partner.lat ?? partner.latitude)
    const pLng = parseFloat(partner.lng ?? partner.longitude)
    if (!isNaN(pLat) && !isNaN(pLng)) {
      setMapCenter([pLat, pLng])
      setMapZoom(13)
    }
  }

  // "Start application here" calls createApplication using scheme/answers from router state, then navigates to /applications
  const handleStartApplication = async (partner) => {
    if (!partner?.id) return
    setSubmittingPartnerId(partner.id)

    try {
      const schemeId =
        routerState.schemeId ||
        routerState.scheme_id ||
        routerState.scheme?.id ||
        routerState.result?.schemeId ||
        routerState.result?.schemeKey ||
        routerState.schemeType ||
        'term_loan'

      const answers = routerState.answers || {}

      await createApplication({
        partnerId: partner.id,
        schemeId,
        ...answers,
        ...(routerState.scheme ? { scheme: routerState.scheme } : {}),
      })
    } catch (err) {
      console.error('Error creating application from locator:', err)
    } finally {
      setSubmittingPartnerId(null)
      navigate('/applications')
    }
  }

  return (
    <AppShell>
      <div className="w-full pt-4 pb-12 px-gutter-lg flex flex-col gap-space-lg text-left">
        {/* Top Header Card with Search & Filters */}
        <div className="flex flex-col gap-space-sm bg-surface-container-lowest p-gutter-md rounded-xl shadow-xs border border-outline-variant/30">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div>
              <div className="inline-flex items-center gap-2 text-secondary font-label-md text-label-md uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span>आधिकारिक चैनल पार्टनर खोजक / Official Channel Partner Locator</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                चैनल पार्टनर खोजें (Find Verified Partners)
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Connect directly with accredited Government Channelising Agencies, Public Sector Banks, and Regional Rural Banks handling loan disbursement and subsidy processing.
              </p>
            </div>
            <div className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-xs rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-tertiary uppercase font-bold tracking-wide">
                {loading
                  ? 'Finding Nearest Desks...'
                  : `${filteredPartners.length} Verified Desks Active`}
              </span>
            </div>
          </div>

          {/* Search bar and Active Capacity switch */}
          <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
            <div className="flex-1 min-w-[280px] relative">
              <div className="flex items-stretch bg-surface-container-low rounded-lg overflow-hidden focus-within:bg-surface-container border border-outline-variant/30">
                <span className="inline-flex items-center justify-center px-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-xl">search</span>
                </span>
                <input
                  className="w-full bg-transparent py-2.5 font-body-md text-body-md text-on-surface outline-none placeholder:text-on-surface-variant"
                  id="geoSearchInput"
                  placeholder="Search by District, City, or 6-digit PIN..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  className="flex items-center gap-1.5 px-3.5 my-1 mr-1 text-primary font-label-md text-label-md rounded bg-surface-container-highest hover:bg-primary-fixed transition-all duration-200 cursor-pointer"
                  id="detectLocationBtn"
                  title="Auto-detect via GPS"
                  type="button"
                  onClick={handleDetectLocation}
                >
                  <span className={`material-symbols-outlined text-sm ${isLocating ? 'animate-spin' : ''}`}>
                    {isLocating ? 'refresh' : 'my_location'}
                  </span>
                  <span>{isLocating ? 'Locating...' : 'GPS Auto-Detect'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                  className="sr-only peer"
                  id="activeCapacityToggle"
                  type="checkbox"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-2 font-label-sm text-label-sm text-on-surface">
                  Show only active counters (सक्रिय काउंटर)
                </span>
              </label>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 pt-1" id="filterChips">
            <button
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                filterType === 'all'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
              onClick={() => setFilterType('all')}
              type="button"
            >
              All Partners ({counts.all})
            </button>
            <button
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                filterType === 'SCA'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
              onClick={() => setFilterType('SCA')}
              type="button"
            >
              State Channelising Agency (SCA - {counts.sca})
            </button>
            <button
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                filterType === 'PSB'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
              onClick={() => setFilterType('PSB')}
              type="button"
            >
              Public Sector Banks (PSB - {counts.psb})
            </button>
            <button
              className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                filterType === 'RRB'
                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
              onClick={() => setFilterType('RRB')}
              type="button"
            >
              Regional Rural Banks (RRB - {counts.rrb})
            </button>
          </div>
        </div>

        {/* Two Columns: Beside the map, a scrollable list panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Scrollable list panel mirroring partner data */}
          <div className="lg:col-span-5 flex flex-col gap-space-md max-h-[820px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-on-surface-variant px-1">
              <span className="font-label-md text-label-md uppercase tracking-wider font-semibold">
                Nearby Verified Branches (निकटतम शाखाएँ)
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                {loading ? 'Locating...' : `${filteredPartners.length} Available • Sorted by Proximity`}
              </span>
            </div>

            {/* Skeleton list while loading (3 pulsing cards) */}
            {loading ? (
              <div className="flex flex-col gap-space-md" role="status" aria-label="Loading verified partners">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="animate-pulse flex flex-col bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 gap-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-5 w-28 bg-surface-container-high rounded" />
                      <div className="h-5 w-48 bg-surface-container-high rounded-full" />
                    </div>
                    <div className="h-6 w-3/4 bg-surface-container-highest rounded mt-1" />
                    <div className="h-4 w-1/2 bg-surface-container-high rounded" />
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-4 w-4 bg-surface-container-high rounded-full" />
                      <div className="h-4 w-44 bg-surface-container-high rounded" />
                    </div>
                    <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col gap-2">
                      <div className="h-3 w-28 bg-surface-container-high rounded" />
                      <div className="flex gap-1.5">
                        <div className="h-4 w-20 bg-surface-container-highest rounded" />
                        <div className="h-4 w-24 bg-surface-container-highest rounded" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-4 w-32 bg-surface-container-high rounded" />
                      <div className="h-4 w-28 bg-surface-container-high rounded" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-10 flex-1 bg-surface-container-high rounded-lg" />
                      <div className="h-10 w-10 bg-surface-container-high rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">storefront</span>
                <p className="font-title-sm text-title-sm text-primary">No partners found matching criteria</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Try disabling active capacity filters or broadening your search query.
                </p>
              </div>
            ) : (
              filteredPartners.map((partner) => {
                const isSelected = selectedPartner?.id === partner.id
                const partnerType = partner.type || partner.partner_type || 'PSB'
                const typeBadge = getPartnerTypeBadge(partner)
                const status = getPartnerStatus(partner)
                const schemes = getPartnerSchemes(partner)
                const locationLabel =
                  partner.location ||
                  [partner.city, partner.state].filter(Boolean).join(', ') ||
                  partner.address
                const distanceDisplay =
                  partner.distanceKm != null ? `${Number(partner.distanceKm).toFixed(1)} km away` : ''
                const deskDisplay = partner.desk || 'Nodal Credit Officer'
                const isSubmitting = submittingPartnerId === partner.id

                return (
                  <div
                    key={partner.id}
                    onClick={() => handlePartnerSelect(partner)}
                    className={`partner-card flex flex-col bg-surface-container-lowest p-space-md rounded-xl transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? 'shadow-md border-primary ring-2 ring-primary/20'
                        : 'shadow-xs hover:shadow-md border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-space-sm mb-2">
                      <span
                        className={`px-2 py-0.5 rounded font-label-sm text-label-sm uppercase font-bold tracking-wide ${
                          partnerType === 'SCA'
                            ? 'bg-primary-fixed text-on-primary-fixed'
                            : partnerType === 'RRB'
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : 'bg-surface-container-highest text-primary'
                        }`}
                      >
                        {typeBadge}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
                          status.isEligible
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-secondary-fixed-dim text-on-secondary-container'
                        }`}
                      >
                        {status.isEligible ? (
                          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                        ) : (
                          <span className="material-symbols-outlined text-xs">warning</span>
                        )}
                        {t(`locator.status.${status.status}.badge`)}
                      </span>
                    </div>

                    <h2 className="font-title-md text-title-md text-primary font-bold leading-snug">
                      {partner.name}
                    </h2>
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      {locationLabel}
                    </span>

                    <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm mt-1 mb-3">
                      <span className="material-symbols-outlined text-sm">near_me</span>
                      <span>
                        {distanceDisplay ? `${distanceDisplay} • ` : ''}
                        {partner.address}
                      </span>
                    </div>

                    <div className="bg-surface-container-low p-2.5 rounded-lg mb-3 flex flex-col gap-1">
                      <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                        Supported Central Schemes:
                      </div>
                      <div className="flex flex-wrap gap-1 font-body-sm text-body-sm text-primary font-medium">
                        {schemes.map((scheme, idx) => (
                          <span key={idx} className="bg-surface-container-highest px-2 py-0.5 rounded">
                            {scheme}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 mb-4 text-on-surface-variant font-label-sm text-label-sm">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base text-primary">badge</span>
                        <span>Desk: <strong>{deskDisplay}</strong></span>
                      </div>
                      <span className={status.isEligible ? 'text-tertiary font-bold' : 'text-secondary font-bold'}>
                        {t(`locator.status.${status.status}.detail`)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-title-sm text-title-sm font-bold transition-all duration-200 cursor-pointer ${
                          status.isEligible
                            ? 'bg-secondary-container text-on-secondary-fixed hover:bg-secondary'
                            : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'
                        }`}
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartApplication(partner)
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <div
                              className="w-4 h-4 border-2 border-on-secondary-fixed border-t-transparent rounded-full animate-spin"
                              role="status"
                              aria-label="Submitting application"
                            />
                            <span>Submitting application...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-base">assignment_turned_in</span>
                            <span>Start application here</span>
                          </>
                        )}
                      </button>
                      <button
                        className="px-3 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary cursor-pointer transition-all duration-200"
                        title="Call Branch Helpline"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (partner.phone) {
                            window.location.href = `tel:${partner.phone}`
                          }
                        }}
                      >
                        <span className="material-symbols-outlined text-base">call</span>
                      </button>
                    </div>
                  </div>
                )
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
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapViewController center={mapCenter} zoom={mapZoom} />

                {/* Only render markers when partners have finished loading */}
                {!loading &&
                  filteredPartners.map((partner) => {
                    const pLat = parseFloat(partner.lat ?? partner.latitude)
                    const pLng = parseFloat(partner.lng ?? partner.longitude)
                    if (isNaN(pLat) || isNaN(pLng)) return null

                    const isSelected = selectedPartner?.id === partner.id
                    const partnerType = partner.type || partner.partner_type || 'PSB'
                    const typeBadge = getPartnerTypeBadge(partner)
                    const status = getPartnerStatus(partner)
                    const distanceDisplay =
                      partner.distanceKm != null ? `${Number(partner.distanceKm).toFixed(1)} km away` : 'Nearby'
                    const isSubmitting = submittingPartnerId === partner.id

                    return (
                      <Marker
                        key={partner.id}
                        position={[pLat, pLng]}
                        icon={createMarkerIcon(partnerType, status.isEligible, isSelected)}
                        eventHandlers={{
                          click: () => {
                            setSelectedPartner(partner)
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
                                    ? 'bg-[#DCFCE7] text-[#14532D]'
                                    : 'bg-[#FEF3C7] text-[#78350F]'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    status.isEligible ? 'bg-[#15803D]' : 'bg-[#B45309]'
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
                                  status.isEligible ? 'text-tertiary font-bold' : 'text-secondary font-bold'
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
                              {isSubmitting ? 'Routing...' : 'Start application here'}
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
              </MapContainer>

              {/* Marker Classification Legend Overlay */}
              <div className="absolute top-4 left-4 z-[400] flex flex-col gap-1.5 bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-xl shadow-md font-label-sm text-label-sm border border-outline-variant/30 pointer-events-auto">
                <span className="font-bold text-primary uppercase tracking-wide">
                  Marker Classification (संकेत चिह्न):
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0b3c5d] flex items-center justify-center text-[10px] text-white font-bold">
                    S
                  </span>
                  <span className="text-on-surface">State Channelising Agency (SCA)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#005323] flex items-center justify-center text-[10px] text-white font-bold">
                    P
                  </span>
                  <span className="text-on-surface">Public Sector Banks (PSB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#904d00] flex items-center justify-center text-[10px] text-white font-bold">
                    R
                  </span>
                  <span className="text-on-surface">Regional Rural Banks (RRB)</span>
                </div>
              </div>

              {/* Reset view button */}
              <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1 bg-surface-container-lowest/95 backdrop-blur-md rounded-lg p-1 shadow-md border border-outline-variant/30">
                <button
                  className="px-2.5 py-1 text-xs font-bold text-primary hover:bg-surface-container rounded transition-all duration-200 cursor-pointer"
                  title="Reset to All India Centroid"
                  type="button"
                  onClick={() => {
                    setMapCenter(INDIA_CENTROID)
                    setMapZoom(DEFAULT_ZOOM)
                  }}
                >
                  India View
                </button>
              </div>

              {/* Selected Branch Detail Bottom Floating Card (Only rendered when not loading) */}
              {!loading && selectedPartner && (
                <div className="absolute bottom-4 left-4 right-4 z-[400] bg-surface-container-lowest/98 backdrop-blur-md p-space-md rounded-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border border-outline-variant/30 pointer-events-auto">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-2xl">account_balance</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-title-sm text-title-sm text-primary font-bold">
                          {selectedPartner.name}
                        </span>
                        {(() => {
                          const status = getPartnerStatus(selectedPartner)
                          return (
                            <span
                              className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${
                                status.isEligible
                                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                  : 'bg-secondary-fixed-dim text-on-secondary-container'
                              }`}
                            >
                              {t(`locator.status.${status.status}.badge`)}
                            </span>
                          )
                        })()}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {selectedPartner.address}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-on-surface-variant font-label-sm text-label-sm">
                        {selectedPartner.distanceKm != null && (
                          <span className="flex items-center gap-1 font-bold text-secondary">
                            <span className="material-symbols-outlined text-sm">near_me</span>
                            {Number(selectedPartner.distanceKm).toFixed(1)} km away
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-secondary">schedule</span>{' '}
                          Working Hours: {selectedPartner.hours || '10:00 AM - 4:00 PM'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-secondary">call</span>{' '}
                          Helpline: {selectedPartner.phone || '1800-11-7788'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      className="flex-1 md:flex-none px-4 py-2.5 rounded-lg bg-secondary-container text-on-secondary-fixed font-title-sm text-title-sm font-bold hover:bg-secondary transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-60"
                      type="button"
                      disabled={submittingPartnerId === selectedPartner.id}
                      onClick={() => handleStartApplication(selectedPartner)}
                    >
                      {submittingPartnerId === selectedPartner.id
                        ? 'Routing...'
                        : 'Start application here'}
                    </button>
                    <button
                      className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary cursor-pointer transition-all duration-200"
                      title="Center Map on Branch"
                      type="button"
                      onClick={() => {
                        const pLat = parseFloat(selectedPartner.lat ?? selectedPartner.latitude)
                        const pLng = parseFloat(selectedPartner.lng ?? selectedPartner.longitude)
                        if (!isNaN(pLat) && !isNaN(pLng)) {
                          setMapCenter([pLat, pLng])
                          setMapZoom(14)
                        }
                      }}
                    >
                      <span className="material-symbols-outlined text-lg">directions</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3 Trust Assurances below map */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
              <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-xs border border-outline-variant/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">assured_workload</span>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-primary font-bold">Direct Verification</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Paperless biometric checks</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-xs border border-outline-variant/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary text-2xl">verified_user</span>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-primary font-bold">No Intermediaries</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Direct credit guarantee desk</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-xs border border-outline-variant/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-2xl">contact_support</span>
                <div className="flex flex-col">
                  <span className="font-title-sm text-title-sm text-primary font-bold">Helpdesk Assist</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Dedicated Nodal Desk Officer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Footer */}
      <footer className="w-full bg-surface-container-lowest py-space-sm px-gutter-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)] mt-auto border-t border-outline-variant/30 text-left">
        <div className="flex flex-wrap items-center justify-between text-on-surface-variant text-label-sm font-label-sm gap-space-md">
          <div>Official portal of the Ministry of Social Justice &amp; Empowerment • Government of India</div>
          <div className="flex items-center gap-space-md">
            <span className="inline-flex items-center gap-1 text-tertiary">
              <span className="material-symbols-outlined text-base">verified_user</span> Certified Data Privacy
            </span>
            <span>Helpline: 1800-11-7788</span>
            <span>Accessibility / Screen Reader Compliant</span>
          </div>
        </div>
      </footer>
    </AppShell>
  )
}
