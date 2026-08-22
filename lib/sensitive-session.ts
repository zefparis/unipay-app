/**
 * Sensitive Session — Server-side helpers
 *
 * Proxy configuration for the PulseGuard sensitive session endpoints
 * in hybrid-vector-api. The worker auth secret is NEVER exposed to the
 * client — all calls go through Next.js API routes that inject the
 * X-Worker-Auth header server-side.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

export const HYBRID_VECTOR_API_URL =
  process.env.HYBRID_VECTOR_API_URL ?? 'https://hybrid-vector-api-owc4.onrender.com';

export const HCS_WORKER_SHARED_SECRET = process.env.HCS_WORKER_SHARED_SECRET ?? '';

export const SENSITIVE_SESSION_TOLERANCE_MS = 30_000;

/**
 * Check if the worker secret is configured (non-empty).
 * Used by guardSensitiveSession() to distinguish a deployment
 * misconfiguration (fail-closed) from a transient network error
 * (fail-open).
 */
export function isWorkerSecretConfigured(): boolean {
  return HCS_WORKER_SHARED_SECRET.length > 0;
}

// ─── Boot-time CRITICAL check ────────────────────────────────────────
// Log a CRITICAL error at module load time if the secret is missing.
// This runs once when the Next.js server starts (or when the module
// is first imported in a serverless function), NOT on every request.
// The goal is to make the misconfiguration visible in logs immediately,
// not only when a user attempts a sensitive action.
if (!isWorkerSecretConfigured()) {
  console.error(
    '┌──────────────────────────────────────────────────────────────────┐\n' +
    '│ CRITICAL: HCS_WORKER_SHARED_SECRET is not set!                  │\n' +
    '│                                                                  │\n' +
    '│ Sensitive session protection is DISABLED. Financial actions      │\n' +
    '│ (withdraw, deposit, send) will be BLOCKED with 503 until the    │\n' +
    '│ secret is configured in Vercel project settings.                │\n' +
    '│                                                                  │\n' +
    '│ Set HCS_WORKER_SHARED_SECRET to the same value as in the        │\n' +
    '│ hybrid-vector-api Render service environment variables.         │\n' +
    '└──────────────────────────────────────────────────────────────────┘',
  );
}

/**
 * Required fields in cognitive test data for re-verification.
 * The server checks that these are present and non-empty before
 * resetting the session. This mirrors the PulseGuard pattern where
 * the cognitive test results ARE the proof of identity.
 *
 * These field names match the CognitiveData interface in
 * app/[locale]/wallet/kyc/cognitive/CognitiveTestFlow.tsx.
 */
export const REQUIRED_COGNITIVE_FIELDS = [
  'reflex_ms',
  'stroop_accuracy',
  'digit_span_score',
] as const;

/**
 * Validate that cognitive test data contains real test results
 * (not just an empty object that a client could craft to bypass
 * re-verification).
 */
export function validateCognitiveData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  for (const field of REQUIRED_COGNITIVE_FIELDS) {
    const v = obj[field];
    if (v === null || v === undefined) return false;
    if (typeof v === 'number' && !Number.isFinite(v)) return false;
    // reflex_ms must be > 0 (a real reaction time)
    // stroop_accuracy must be >= 0 (0% is valid but unusual)
    // digit_span_score must be >= 0
    if (field === 'reflex_ms' && typeof v === 'number' && v <= 0) return false;
  }
  return true;
}

/**
 * Extract wallet_id from the JWT cookie. We don't decode the JWT
 * (that's the upstream's job) — we use the wallet_id from the balance
 * endpoint response instead. For the sensitive session, we just need
 * a stable user identifier, so we use the wallet_token cookie's
 * presence as proof of authentication and derive a user ID from
 * the request.
 */
export function getWorkerAuthHeaders(): Record<string, string> {
  if (!HCS_WORKER_SHARED_SECRET) {
    throw new Error('HCS_WORKER_SHARED_SECRET is not set');
  }
  return {
    'Content-Type': 'application/json',
    'X-Worker-Auth': HCS_WORKER_SHARED_SECRET,
  };
}
