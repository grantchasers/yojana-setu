import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

/**
 * Custom hook to manage applications for a citizen/applicant.
 *
 * @param {string} userId - ID of the authenticated user
 * @returns {{ applications: Array, createApplication: Function, loading: boolean, error: any }}
 */
export function useApplications(userId) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const localStorageKey = `yojana_applications_${userId || "anonymous"}`;

  const readLocalApplications = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(localStorageKey) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }, [localStorageKey]);

  const writeLocalApplications = useCallback(
    (rows) => {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(rows));
      } catch {
        // Local persistence is best-effort in offline mode.
      }
    },
    [localStorageKey],
  );

  const attachStatusHistory = useCallback(async (rows) => {
    const applicationIds = (rows || []).map((app) => app.id).filter(Boolean);
    if (applicationIds.length === 0) return rows || [];

    const { data: history, error: historyError } = await supabase
      .from("application_status_history")
      .select("*")
      .in("application_id", applicationIds)
      .order("created_at", { ascending: true });

    if (historyError) {
      console.warn(
        "[Applications] Status history unavailable:",
        historyError.message || historyError,
      );
      return (rows || []).map((app) => ({ ...app, status_history: [] }));
    }

    const historyByApplication = new Map();
    (history || []).forEach((event) => {
      const events = historyByApplication.get(event.application_id) || [];
      events.push(event);
      historyByApplication.set(event.application_id, events);
    });

    return (rows || []).map((app) => ({
      ...app,
      status_history: historyByApplication.get(app.id) || [],
    }));
  }, []);

  const fetchApplications = useCallback(
    async (showLoading = true) => {
      if (!userId) {
        setApplications([]);
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      try {
        // Attempt PostgREST foreign key join first
        const { data, error: joinError } = await supabase
          .from("applications")
          .select(
            `
            *,
            schemes (
              *
            ),
            channel_partners (
              *
            )
          `,
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (joinError) {
          // Fallback if PostgREST cache has not indexed foreign key relationships:
          // fetch applications directly and manually join schemes & channel_partners
          const { data: rawApps, error: rawError } = await supabase
            .from("applications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (rawError) {
            throw rawError;
          }

          const schemeIds = [
            ...new Set(
              (rawApps || [])
                .map((a) => a.scheme_id || a.schemeId)
                .filter(Boolean),
            ),
          ];
          const partnerIds = [
            ...new Set(
              (rawApps || [])
                .map((a) => a.partner_id || a.partnerId)
                .filter(Boolean),
            ),
          ];

          const [schemesRes, partnersRes] = await Promise.all([
            schemeIds.length > 0
              ? supabase.from("schemes").select("*").in("id", schemeIds)
              : Promise.resolve({ data: [] }),
            partnerIds.length > 0
              ? supabase
                  .from("channel_partners")
                  .select("*")
                  .in("id", partnerIds)
              : Promise.resolve({ data: [] }),
          ]);

          const schemesMap = new Map(
            (schemesRes.data || []).map((s) => [s.id, s]),
          );
          const partnersMap = new Map(
            (partnersRes.data || []).map((p) => [p.id, p]),
          );

          const enriched = (rawApps || []).map((app) => {
            const scheme =
              schemesMap.get(app.scheme_id || app.schemeId) || null;
            const partner =
              partnersMap.get(app.partner_id || app.partnerId) || null;

            const schemeName =
              scheme?.name || scheme?.title || app.scheme_name || null;
            const partnerName = partner?.name || app.partner_name || null;

            return {
              ...app,
              schemes: scheme,
              channel_partners: partner,
              scheme_name: schemeName,
              schemeName: schemeName,
              partner_name: partnerName,
              partnerName: partnerName,
            };
          });

          setApplications(await attachStatusHistory(enriched));
        } else {
          // Normalize joined fields so consumers can access them seamlessly
          const formatted = (data || []).map((app) => {
            const schemeName =
              app.schemes?.name ||
              app.schemes?.title ||
              app.scheme_name ||
              null;
            const partnerName =
              app.channel_partners?.name || app.partner_name || null;

            return {
              ...app,
              scheme_name: schemeName,
              schemeName: schemeName,
              partner_name: partnerName,
              partnerName: partnerName,
            };
          });

          setApplications(await attachStatusHistory(formatted));
        }
      } catch (err) {
        setError(err.message || String(err));
        setApplications([]);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [userId, attachStatusHistory],
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!userId) {
        setApplications([]);
        setLoading(false);
        return;
      }

      if (userId === "demo-user") {
        setApplications(readLocalApplications());
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await fetchApplications(true);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    if (userId && userId !== "demo-user") {
      const channel = supabase
        .channel(`application-tracking-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "applications",
            filter: `user_id=eq.${userId}`,
          },
          () => fetchApplications(false),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "application_status_history" },
          () => fetchApplications(false),
        )
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [userId, fetchApplications, readLocalApplications]);

  /**
   * Creates a new application.
   * Inserts row with status 'submitted', then updates to 'routed' if partnerId was provided.
   */
  const createApplication = useCallback(
    async (params = {}) => {
      const schemeId = params.schemeId ?? params.scheme_id;
      const partnerId = params.partnerId ?? params.partner_id;
      const projectType = params.projectType ?? params.project_type;
      const projectCost = params.projectCost ?? params.project_cost;
      const requestedAmount = params.requestedAmount ?? params.requested_amount;
      const monthlyFamilyIncome =
        params.monthlyFamilyIncome ?? params.monthly_family_income;
      const educationStatus = params.educationStatus ?? params.education_status;

      const parseNumeric = (val) => {
        if (val === undefined || val === null || val === "") return null;
        if (typeof val === "number") return val;
        const cleaned = String(val).replace(/,/g, "").trim();
        const parsed = Number(cleaned);
        return isNaN(parsed) ? val : parsed;
      };

      const insertPayload = {
        user_id: userId,
        scheme_id: schemeId,
        partner_id: partnerId || null,
        project_type: projectType,
        project_cost: parseNumeric(projectCost),
        requested_amount: parseNumeric(requestedAmount),
        monthly_family_income: parseNumeric(monthlyFamilyIncome),
        education_status: educationStatus,
        status: "submitted",
      };

      if (!userId || userId === "demo-user") {
        const mock = {
          ...insertPayload,
          id: `YS-${Date.now()}`,
          status: partnerId ? "routed" : "submitted",
          created_at: new Date().toISOString(),
          is_demo: true,
          status_history: [
            {
              status: partnerId ? "routed" : "submitted",
              created_at: new Date().toISOString(),
              description: partnerId
                ? "Application routed to the selected partner."
                : "Application submitted from the portal.",
              source: "offline_application_record",
            },
          ],
        };
        const nextApplications = [mock, ...readLocalApplications()];
        writeLocalApplications(nextApplications);
        setApplications(nextApplications);
        return { ...mock, data: mock, error: null };
      }

      try {
        // Step 1: Insert application with status 'submitted'
        const { data: insertedData, error: insertError } = await supabase
          .from("applications")
          .insert([insertPayload])
          .select();

        if (insertError) {
          throw insertError;
        }

        let currentApp = Array.isArray(insertedData)
          ? insertedData[0]
          : insertedData;

        // Step 2: Update status to 'routed' if partnerId was provided
        if (partnerId && currentApp?.id) {
          const { data: updatedData, error: updateError } = await supabase
            .from("applications")
            .update({ status: "routed" })
            .eq("id", currentApp.id)
            .select();

          if (updateError) {
            console.error(
              "Error updating application status to routed:",
              updateError,
            );
          } else if (updatedData) {
            currentApp = Array.isArray(updatedData)
              ? updatedData[0]
              : updatedData;
          }
        }

        // Refresh applications list quietly to update local state
        await fetchApplications(false);

        return {
          ...currentApp,
          data: currentApp,
          error: null,
        };
      } catch (err) {
        setError(err.message || String(err));
        return {
          data: null,
          error: err,
        };
      }
    },
    [userId, fetchApplications, readLocalApplications, writeLocalApplications],
  );

  return {
    applications,
    createApplication,
    loading,
    error,
    refetch: fetchApplications,
  };
}

export default useApplications;
