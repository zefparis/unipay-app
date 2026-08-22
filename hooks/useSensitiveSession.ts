'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Sensitive Session Status
 * - 'active': session is valid, submit allowed
 * - 'suspended': user left the app, within tolerance window
 * - 'invalidated': tolerance expired, re-verification required
 * - 'loading': initial state, not yet checked
 */
export type SensitiveSessionStatus =
  | 'loading'
  | 'active'
  | 'suspended'
  | 'invalidated';

interface UseSensitiveSessionOptions {
  /** The sensitive action this session protects (for session ID generation) */
  action: 'withdraw' | 'deposit' | 'send';
  /** Called when the session becomes invalidated (to show re-verify UI) */
  onInvalidated?: () => void;
}

interface UseSensitiveSessionReturn {
  status: SensitiveSessionStatus;
  sessionId: string;
  /** True when status === 'active' (submit allowed) */
  canSubmit: boolean;
  /** True when re-verification is required (status === 'invalidated') */
  reverifyRequired: boolean;
  /** Submit cognitive test results to re-verify the session */
  reverify: (cognitiveData: unknown) => Promise<boolean>;
  /** Manually refresh status from server */
  refreshStatus: () => Promise<void>;
}

/**
 * useSensitiveSession — manages a PulseGuard-style sensitive session
 * for a financial action page (withdraw, deposit, send).
 *
 * On mount:
 *   - Generates a unique session ID
 *   - Status starts as 'active' (no session record = active per server logic)
 *
 * On visibilitychange → hidden:
 *   - POST /api/wallet/sensitive/session-visibility { event: 'blur' }
 *   - Server creates/suspends the session, starts 30s tolerance timer
 *
 * On visibilitychange → visible:
 *   - POST /api/wallet/sensitive/session-visibility { event: 'focus' }
 *   - GET /api/wallet/sensitive/session-status
 *   - If 'invalidated': block submit, show re-verify UI
 *   - If 'active': submit allowed again
 *
 * Re-verification:
 *   - Client runs CognitiveTestFlow
 *   - Results submitted via reverify() → POST /api/wallet/sensitive/reverify
 *   - Server validates cognitive data, resets session to 'active'
 *   - Only works if status is 'invalidated' (conditional UPDATE server-side)
 */
export function useSensitiveSession({
  action,
  onInvalidated,
}: UseSensitiveSessionOptions): UseSensitiveSessionReturn {
  const [status, setStatus] = useState<SensitiveSessionStatus>('loading');
  const sessionIdRef = useRef<string>('');
  const onInvalidatedRef = useRef(onInvalidated);
  onInvalidatedRef.current = onInvalidated;

  // Generate a stable session ID for this page mount
  if (!sessionIdRef.current) {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    sessionIdRef.current = `unipay_${action}_${ts}_${rand}`;
  }
  const sessionId = sessionIdRef.current;

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/wallet/sensitive/session-status?sessionId=${encodeURIComponent(sessionId)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; status: string };
      const newStatus = (data.status === 'active' || data.status === 'suspended' || data.status === 'invalidated')
        ? (data.status as SensitiveSessionStatus)
        : 'active';
      setStatus(newStatus);
      if (newStatus === 'invalidated') {
        onInvalidatedRef.current?.();
      }
    } catch {
      // Network error — don't block the user (fail open for UX)
      // The backend guard will still enforce server-side
    }
  }, [sessionId]);

  useEffect(() => {
    // Initial status check — no session record means 'active'
    refreshStatus();

    let blurTimer: ReturnType<typeof setTimeout> | null = null;

    async function sendVisibilityEvent(event: 'blur' | 'focus') {
      try {
        await fetch('/api/wallet/sensitive/session-visibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, event }),
        });
      } catch {
        // Fire-and-forget — don't block UX
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        // User left the app — send blur event
        sendVisibilityEvent('blur');
        setStatus('suspended');
      } else if (document.visibilityState === 'visible') {
        // User returned — send focus event, then check status
        if (blurTimer) {
          clearTimeout(blurTimer);
          blurTimer = null;
        }
        sendVisibilityEvent('focus').then(() => {
          refreshStatus();
        });
      }
    }

    function onFocus() {
      // window focus event (catches tab switch back without visibilitychange)
      if (document.visibilityState === 'visible') {
        sendVisibilityEvent('focus').then(() => {
          refreshStatus();
        });
      }
    }

    function onBlur() {
      // window blur event (catches tab switch away)
      if (document.visibilityState === 'hidden') {
        sendVisibilityEvent('blur');
        setStatus('suspended');
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      if (blurTimer) clearTimeout(blurTimer);
    };
  }, [sessionId, refreshStatus]);

  const reverify = useCallback(
    async (cognitiveData: unknown): Promise<boolean> => {
      try {
        const res = await fetch('/api/wallet/sensitive/reverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, cognitiveData }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { ok: boolean; status: string };
        if (data.ok && data.status === 'active') {
          setStatus('active');
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [sessionId],
  );

  return {
    status,
    sessionId,
    canSubmit: status === 'active',
    reverifyRequired: status === 'invalidated',
    reverify,
    refreshStatus,
  };
}
