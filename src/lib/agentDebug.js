/** Session-scoped debug ingest for Compute Scheme / UI state investigations. */
export function agentLog({ hypothesisId, location, message, data = {}, runId = 'pre-fix' }) {
  // #region agent log
  fetch('http://127.0.0.1:7829/ingest/04e302b7-ea91-4ad8-80fd-b3dd8f79a700', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '094eb0' },
    body: JSON.stringify({
      sessionId: '094eb0',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
      runId,
    }),
  }).catch(() => {})
  // #endregion
}
