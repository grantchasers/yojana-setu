import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";
import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

// Fixed road-distance reference requested for the imported Maharashtra bank directory.
// Values are measured from Kharghar Railway Station and intentionally do not change
// when the user uses GPS Auto-Detect.
const KHARGHAR_STATION_DISTANCE_KM_BY_CITY = {
  Mumbai: 34,
  Pune: 125,
  Nashik: 181,
  Nagpur: 837,
  Aurangabad: 345,
  Kolhapur: 405,
  Sangli: 436,
  Solapur: 375,
};

async function loadMaharashtraBranches() {
  try {
    const response = await fetch("/maharashtra_national_banks_full.db");
    if (!response.ok) return [];
    const bytes = new Uint8Array(await response.arrayBuffer());
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    const database = new SQL.Database(bytes);
    const result = database.exec(`
      SELECT
        'maharashtra-' || branches.branch_id AS id,
        banks.bank_name || ' - ' || branches.branch_name AS name,
        banks.short_name AS short_name,
        'PSB' AS type,
        branches.address,
        branches.city,
        branches.district,
        branches.state,
        branches.pincode,
        branches.ifsc,
        branches.phone
      FROM branches
      JOIN banks ON banks.bank_id = branches.bank_id
      ORDER BY branches.city, banks.bank_name, branches.branch_name
    `);
    database.close();

    const rows = result[0]?.values || [];
    const cityPartners = rows.map((row) => {
      const [
        id,
        name,
        shortName,
        type,
        address,
        city,
        district,
        state,
        pincode,
        ifsc,
        phone,
      ] = row;
      const coordinates = {
        Mumbai: [19.076, 72.8777],
        Pune: [18.5204, 73.8567],
        Nagpur: [21.1458, 79.0882],
        Nashik: [19.9975, 73.7898],
        Aurangabad: [19.8762, 75.3433],
        Kolhapur: [16.705, 74.2433],
        Sangli: [16.8524, 74.5815],
        Solapur: [17.6599, 75.9064],
      }[city] || [19.7515, 75.7139];
      return {
        id,
        name,
        short_name: shortName,
        type,
        partner_type: type,
        address,
        city,
        district,
        state,
        pincode,
        ifsc,
        phone,
        lat: coordinates[0],
        lng: coordinates[1],
        is_eligible: false,
        accepted_scheme_types: ["term_loan", "micro_finance", "education_loan"],
        coordinates_approximate: true,
        fixedDistanceKm: KHARGHAR_STATION_DISTANCE_KM_BY_CITY[city] ?? null,
        distanceReference: "Kharghar Railway Station",
        source: "maharashtra_national_banks_full.db",
      };
    });

    let cachedCoordinates = {};
    try {
      cachedCoordinates = JSON.parse(
        localStorage.getItem("yojana_partner_coordinates") || "{}",
      );
    } catch {
      cachedCoordinates = {};
    }

    const geocodedPartners = await Promise.all(
      cityPartners.map(async (partner) => {
        const query = [partner.address, partner.city, partner.state, "India"]
          .filter(Boolean)
          .join(", ");
        const cacheKey = partner.id;
        if (cachedCoordinates[cacheKey]) {
          return {
            ...partner,
            ...cachedCoordinates[cacheKey],
            coordinates_approximate: false,
          };
        }
        try {
          const response = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`,
          );
          if (!response.ok) return partner;
          const payload = await response.json();
          const coordinates = payload.features?.[0]?.geometry?.coordinates;
          if (!Array.isArray(coordinates) || coordinates.length < 2)
            return partner;
          const resolved = {
            lng: Number(coordinates[0]),
            lat: Number(coordinates[1]),
          };
          cachedCoordinates[cacheKey] = resolved;
          return { ...partner, ...resolved, coordinates_approximate: false };
        } catch {
          return partner;
        }
      }),
    );

    try {
      localStorage.setItem(
        "yojana_partner_coordinates",
        JSON.stringify(cachedCoordinates),
      );
    } catch {
      // Coordinate caching is optional.
    }
    return geocodedPartners;
  } catch (error) {
    console.warn("Maharashtra partner database could not be loaded:", error);
    return [];
  }
}

async function mergePartnerSources(remotePartners) {
  let localPartners = [];
  try {
    localPartners = JSON.parse(
      localStorage.getItem("yojana_local_partners") || "[]",
    );
  } catch {
    localPartners = [];
  }
  const importedPartners = await loadMaharashtraBranches();
  const merged = new Map();
  [...(remotePartners || []), ...importedPartners, ...localPartners].forEach(
    (partner) => {
      if (partner?.id) merged.set(partner.id, partner);
    },
  );
  return [...merged.values()];
}

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
  const R = 6371; // Earth's mean radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper to check if partner's accepted scheme types match the requested schemeType.
 * Handles arrays, JSON strings, and variations in casing/delimiters.
 */
function isSchemeTypeAccepted(partner, schemeType) {
  if (!schemeType) return true;

  const types =
    partner.accepted_scheme_types ??
    partner.acceptedSchemeTypes ??
    partner.schemes;

  if (!types) return false;

  const normalize = (str) =>
    String(str || "")
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  const targetNorm = normalize(schemeType);

  if (Array.isArray(types)) {
    return types.some((t) => {
      const itemNorm = normalize(t);
      return (
        itemNorm === targetNorm ||
        itemNorm.includes(targetNorm) ||
        targetNorm.includes(itemNorm)
      );
    });
  }

  if (typeof types === "string") {
    try {
      const parsed = JSON.parse(types);
      if (Array.isArray(parsed)) {
        return parsed.some((t) => {
          const itemNorm = normalize(t);
          return (
            itemNorm === targetNorm ||
            itemNorm.includes(targetNorm) ||
            targetNorm.includes(itemNorm)
          );
        });
      }
    } catch {
      // not JSON string, treat as delimited or plain string
    }
    const strNorm = normalize(types);
    return strNorm.includes(targetNorm);
  }

  return false;
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
  if (!Array.isArray(partners)) return [];

  const uLat = parseFloat(userLat);
  const uLng = parseFloat(userLng);

  return partners
    .filter((partner) => {
      // Keep newly onboarded/capped partners visible; the locator's Active toggle
      // is responsible for narrowing the directory to currently eligible desks.
      return isSchemeTypeAccepted(partner, schemeType);
    })
    .map((partner) => {
      const pLat = parseFloat(partner.lat ?? partner.latitude);
      const pLng = parseFloat(partner.lng ?? partner.longitude);

      let distanceKm = null;
      if (Number.isFinite(Number(partner.fixedDistanceKm))) {
        distanceKm = Number(partner.fixedDistanceKm);
      } else if (!isNaN(uLat) && !isNaN(uLng) && !isNaN(pLat) && !isNaN(pLng)) {
        distanceKm = Number(
          calculateHaversineDistanceKm(uLat, uLng, pLat, pLng).toFixed(2),
        );
      }

      return {
        ...partner,
        distanceKm,
      };
    })
    .sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

export function usePartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("channel_partners")
        .select("*");

      if (fetchError) {
        throw fetchError;
      }

      setPartners(await mergePartnerSources(data));
    } catch (err) {
      setError(err.message || String(err));
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("channel_partners")
          .select("*");

        if (!isMounted) return;

        if (fetchError) {
          throw fetchError;
        }

        setPartners(await mergePartnerSources(data));
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || String(err));
        setPartners([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    const channel = supabase
      .channel("partners-rt")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "channel_partners" },
        (payload) => {
          setPartners((prev) =>
            prev.map((p) =>
              p.id === payload.new.id ? { ...p, ...payload.new } : p,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const addPartner = useCallback(async (partner) => {
    const record = {
      id: partner.id || `local-partner-${Date.now()}`,
      ...partner,
      is_eligible: Boolean(partner.is_eligible),
    };

    try {
      const { data, error: insertError } = await supabase
        .from("channel_partners")
        .insert(record)
        .select()
        .single();
      if (!insertError && data) {
        setPartners((previous) => [...previous, data]);
        return data;
      }
    } catch {
      // Offline/demo mode persists locally below.
    }

    const localPartners = JSON.parse(
      localStorage.getItem("yojana_local_partners") || "[]",
    );
    localStorage.setItem(
      "yojana_local_partners",
      JSON.stringify([...localPartners, record]),
    );
    setPartners((previous) => [...previous, record]);
    return record;
  }, []);

  // Expose findNearest helper supporting both:
  // findNearest(partners, userLat, userLng, schemeType) and findNearest(userLat, userLng, schemeType)
  const findNearestHelper = useCallback(
    (partnersOrLat, userLatOrLng, userLngOrSchemeType, maybeSchemeType) => {
      if (Array.isArray(partnersOrLat)) {
        return findNearest(
          partnersOrLat,
          userLatOrLng,
          userLngOrSchemeType,
          maybeSchemeType,
        );
      }
      return findNearest(
        partners,
        partnersOrLat,
        userLatOrLng,
        userLngOrSchemeType,
      );
    },
    [partners],
  );

  return {
    partners,
    findNearest: findNearestHelper,
    loading,
    error,
    addPartner,
    refetch: fetchPartners,
  };
}

export default usePartners;
