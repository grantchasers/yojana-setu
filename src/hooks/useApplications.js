import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * Custom hook to manage applications for a citizen/applicant.
 *
 * @param {string} userId - ID of the authenticated user
 * @returns {{ applications: Array, createApplication: Function, loading: boolean, error: any }}
 */
export function useApplications(userId) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchApplications = useCallback(
    async (showLoading = true) => {
      if (!userId) {
        setApplications([])
        setLoading(false)
        return
      }

      if (showLoading) {
        setLoading(true)
      }
      setError(null)

      try {
        // Attempt PostgREST foreign key join first
        const { data, error: joinError } = await supabase
          .from('applications')
          .select(`
            *,
            schemes (
              *
            ),
            channel_partners (
              *
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (joinError) {
          // Fallback if PostgREST cache has not indexed foreign key relationships:
          // fetch applications directly and manually join schemes & channel_partners
          const { data: rawApps, error: rawError } = await supabase
            .from('applications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (rawError) {
            throw rawError
          }

          const schemeIds = [
            ...new Set(
              (rawApps || [])
                .map((a) => a.scheme_id || a.schemeId)
                .filter(Boolean)
            ),
          ]
          const partnerIds = [
            ...new Set(
              (rawApps || [])
                .map((a) => a.partner_id || a.partnerId)
                .filter(Boolean)
            ),
          ]

          const [schemesRes, partnersRes] = await Promise.all([
            schemeIds.length > 0
              ? supabase.from('schemes').select('*').in('id', schemeIds)
              : Promise.resolve({ data: [] }),
            partnerIds.length > 0
              ? supabase.from('channel_partners').select('*').in('id', partnerIds)
              : Promise.resolve({ data: [] }),
          ])

          const schemesMap = new Map(
            (schemesRes.data || []).map((s) => [s.id, s])
          )
          const partnersMap = new Map(
            (partnersRes.data || []).map((p) => [p.id, p])
          )

          const enriched = (rawApps || []).map((app) => {
            const scheme =
              schemesMap.get(app.scheme_id || app.schemeId) || null
            const partner =
              partnersMap.get(app.partner_id || app.partnerId) || null

            const schemeName =
              scheme?.name || scheme?.title || app.scheme_name || null
            const partnerName =
              partner?.name || app.partner_name || null

            return {
              ...app,
              schemes: scheme,
              channel_partners: partner,
              scheme_name: schemeName,
              schemeName: schemeName,
              partner_name: partnerName,
              partnerName: partnerName,
            }
          })

          setApplications(enriched)
        } else {
          // Normalize joined fields so consumers can access them seamlessly
          const formatted = (data || []).map((app) => {
            const schemeName =
              app.schemes?.name ||
              app.schemes?.title ||
              app.scheme_name ||
              null
            const partnerName =
              app.channel_partners?.name ||
              app.partner_name ||
              null

            return {
              ...app,
              scheme_name: schemeName,
              schemeName: schemeName,
              partner_name: partnerName,
              partnerName: partnerName,
            }
          })

          setApplications(formatted)
        }
      } catch (err) {
        setError(err.message || String(err))
        setApplications([])
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    },
    [userId]
  )

  useEffect(() => {
    let isMounted = true

    async function load() {
      if (!userId) {
        setApplications([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        await fetchApplications(true)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [userId, fetchApplications])

  /**
   * Creates a new application.
   * Inserts row with status 'submitted', then updates to 'routed' if partnerId was provided.
   */
  const createApplication = useCallback(
    async (params = {}) => {
      const schemeId = params.schemeId ?? params.scheme_id
      const partnerId = params.partnerId ?? params.partner_id
      const projectType = params.projectType ?? params.project_type
      const projectCost = params.projectCost ?? params.project_cost
      const requestedAmount = params.requestedAmount ?? params.requested_amount
      const monthlyFamilyIncome =
        params.monthlyFamilyIncome ?? params.monthly_family_income
      const educationStatus =
        params.educationStatus ?? params.education_status

      const parseNumeric = (val) => {
        if (val === undefined || val === null || val === '') return null
        if (typeof val === 'number') return val
        const cleaned = String(val).replace(/,/g, '').trim()
        const parsed = Number(cleaned)
        return isNaN(parsed) ? val : parsed
      }

      const insertPayload = {
        user_id: userId,
        scheme_id: schemeId,
        partner_id: partnerId || null,
        project_type: projectType,
        project_cost: parseNumeric(projectCost),
        requested_amount: parseNumeric(requestedAmount),
        monthly_family_income: parseNumeric(monthlyFamilyIncome),
        education_status: educationStatus,
        status: 'submitted',
      }

      try {
        // Step 1: Insert application with status 'submitted'
        const { data: insertedData, error: insertError } = await supabase
          .from('applications')
          .insert([insertPayload])
          .select()

        if (insertError) {
          throw insertError
        }

        let currentApp = Array.isArray(insertedData)
          ? insertedData[0]
          : insertedData

        // Step 2: Update status to 'routed' if partnerId was provided
        if (partnerId && currentApp?.id) {
          const { data: updatedData, error: updateError } = await supabase
            .from('applications')
            .update({ status: 'routed' })
            .eq('id', currentApp.id)
            .select()

          if (updateError) {
            console.error(
              'Error updating application status to routed:',
              updateError
            )
          } else if (updatedData) {
            currentApp = Array.isArray(updatedData)
              ? updatedData[0]
              : updatedData
          }
        }

        // Refresh applications list quietly to update local state
        await fetchApplications(false)

        return {
          ...currentApp,
          data: currentApp,
          error: null,
        }
      } catch (err) {
        setError(err.message || String(err))
        return {
          data: null,
          error: err,
        }
      }
    },
    [userId, fetchApplications]
  )

  return {
    applications,
    createApplication,
    loading,
    error,
    refetch: fetchApplications,
  }
}

export default useApplications
