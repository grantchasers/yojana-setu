import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * Calculates great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of first point in decimal degrees
 * @param {number} lon1 - Longitude of first point in decimal degrees
 * @param {number} lat2 - Latitude of second point in decimal degrees
 * @param {number} lon2 - Longitude of second point in decimal degrees
 * @returns {number} Distance in kilometers
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's mean radius in km
  const toRad = (deg) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Helper to check if partner's accepted scheme types match the requested schemeType.
 * Handles arrays, JSON strings, and variations in casing/delimiters.
 */
function isSchemeTypeAccepted(partner, schemeType) {
  if (!schemeType) return true

  const types =
    partner.accepted_scheme_types ??
    partner.acceptedSchemeTypes ??
    partner.schemes

  if (!types) return false

  const normalize = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/[\s_-]+/g, '')

  const targetNorm = normalize(schemeType)

  if (Array.isArray(types)) {
    return types.some((t) => {
      const itemNorm = normalize(t)
      return (
        itemNorm === targetNorm ||
        itemNorm.includes(targetNorm) ||
        targetNorm.includes(itemNorm)
      )
    })
  }

  if (typeof types === 'string') {
    try {
      const parsed = JSON.parse(types)
      if (Array.isArray(parsed)) {
        return parsed.some((t) => {
          const itemNorm = normalize(t)
          return (
            itemNorm === targetNorm ||
            itemNorm.includes(targetNorm) ||
            targetNorm.includes(itemNorm)
          )
        })
      }
    } catch {
      // not JSON string, treat as delimited or plain string
    }
    const strNorm = normalize(types)
    return strNorm.includes(targetNorm)
  }

  return false
}

/**
 * Finds and sorts channel partners nearest to the user coordinates,
 * filtered to is_eligible === true and accepted_scheme_types including schemeType.
 *
 * @param {Array} partners - List of partner objects
 * @param {number} userLat - User latitude
 * @param {number} userLng - User longitude
 * @param {string} [schemeType] - Required scheme type filter
 * @returns {Array} Filtered and sorted partners with distanceKm field
 */
export function findNearest(partners, userLat, userLng, schemeType) {
  if (!Array.isArray(partners)) return []

  const uLat = parseFloat(userLat)
  const uLng = parseFloat(userLng)

  return partners
    .filter((partner) => {
      // Filter to is_eligible === true
      const isEligible = partner.is_eligible === true || partner.isEligible === true
      if (!isEligible) return false

      // Filter to accepted_scheme_types including schemeType
      return isSchemeTypeAccepted(partner, schemeType)
    })
    .map((partner) => {
      const pLat = parseFloat(partner.lat ?? partner.latitude)
      const pLng = parseFloat(partner.lng ?? partner.longitude)

      let distanceKm = null
      if (!isNaN(uLat) && !isNaN(uLng) && !isNaN(pLat) && !isNaN(pLng)) {
        distanceKm = Number(
          calculateHaversineDistanceKm(uLat, uLng, pLat, pLng).toFixed(2)
        )
      }

      return {
        ...partner,
        distanceKm,
      }
    })
    .sort((a, b) => {
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })
}

export function usePartners() {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPartners = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('channel_partners')
        .select('*')

      if (fetchError) {
        throw fetchError
      }

      setPartners(data || [])
    } catch (err) {
      setError(err.message || String(err))
      setPartners([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await supabase
          .from('channel_partners')
          .select('*')

        if (!isMounted) return

        if (fetchError) {
          throw fetchError
        }

        setPartners(data || [])
      } catch (err) {
        if (!isMounted) return
        setError(err.message || String(err))
        setPartners([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    const channel = supabase
      .channel('partners-rt')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'channel_partners' },
        (payload) => {
          setPartners((prev) =>
            prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
          )
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])

  // Expose findNearest helper supporting both:
  // findNearest(partners, userLat, userLng, schemeType) and findNearest(userLat, userLng, schemeType)
  const findNearestHelper = useCallback(
    (partnersOrLat, userLatOrLng, userLngOrSchemeType, maybeSchemeType) => {
      if (Array.isArray(partnersOrLat)) {
        return findNearest(
          partnersOrLat,
          userLatOrLng,
          userLngOrSchemeType,
          maybeSchemeType
        )
      }
      return findNearest(
        partners,
        partnersOrLat,
        userLatOrLng,
        userLngOrSchemeType
      )
    },
    [partners]
  )

  return {
    partners,
    findNearest: findNearestHelper,
    loading,
    error,
    refetch: fetchPartners,
  }
}

export default usePartners
