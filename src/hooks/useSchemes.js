import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function useSchemes() {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSchemes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('schemes')
        .select('*')

      if (fetchError) {
        throw fetchError
      }

      setSchemes(data || [])
    } catch (err) {
      setError(err.message || String(err))
      setSchemes([])
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
          .from('schemes')
          .select('*')

        if (!isMounted) return

        if (fetchError) {
          throw fetchError
        }

        setSchemes(data || [])
      } catch (err) {
        if (!isMounted) return
        setError(err.message || String(err))
        setSchemes([])
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
  }, [])

  return { schemes, loading, error, refetch: fetchSchemes }
}

export default useSchemes
