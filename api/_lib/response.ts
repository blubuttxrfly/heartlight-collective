// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — API Response Helpers
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status)
}

export function success(data?: unknown): Response {
  return json(data ?? { success: true })
}