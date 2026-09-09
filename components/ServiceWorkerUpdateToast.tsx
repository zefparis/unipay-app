'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * ServiceWorkerUpdateToast — non-intrusive update notification.
 *
 * When a new service worker is installed and takes control (via
 * skipWaiting, which is already enabled in the generated SW), the
 * page's JavaScript is still the old version. Old chunks may reference
 * hashes that no longer exist on the server, causing 404s and errors.
 *
 * This component detects when a new SW has taken control and shows a
 * non-intrusive toast prompting the user to reload. The user can:
 *   - Click "Recharger" → window.location.reload() (gets new JS)
 *   - Click "Plus tard" → dismiss (will see it again on next visit)
 *   - Ignore it → no forced reload, won't interrupt their action
 *
 * Detection strategy:
 *   1. On mount: check if there's a waiting SW (registration.waiting)
 *   2. Listen for `updatefound` on the registration → new SW installing
 *   3. When the installing SW reaches `installed` state and is waiting,
 *      show the toast (skipWaiting will activate it shortly)
 *   4. Also listen for `controllerchange` as a fallback — if the new
 *      SW already took control before this component mounted
 *
 * We do NOT post SKIP_WAITING because the generated SW already calls
 * self.skipWaiting() unconditionally during installation.
 */
export function ServiceWorkerUpdateToast() {
  const [showUpdate, setShowUpdate] = useState(false);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let mounted = true;
    // Track the initial controller so we don't show the toast on
    // first-ever SW registration (when controller goes from null → SW).
    let initialController = navigator.serviceWorker.controller;

    function checkWaiting(reg: ServiceWorkerRegistration) {
      if (reg.waiting && mounted) {
        // A new SW is installed and waiting — skipWaiting() will
        // activate it, but the page JS is still old. Show the toast.
        setShowUpdate(true);
      }
    }

    function onControllerChange() {
      // Only show toast if this is a real update (controller was
      // already set before), not the first-ever SW registration.
      if (initialController && mounted) {
        setShowUpdate(true);
      }
      // Update the reference so subsequent changes are also detected
      initialController = navigator.serviceWorker.controller;
    }

    function onUpdateFound(event: Event) {
      const reg = event.target as ServiceWorkerRegistration;
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && reg.waiting && mounted) {
          setShowUpdate(true);
        }
      });
    }

    // Initial check + register listeners
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || !mounted) return;
      checkWaiting(reg);
      reg.addEventListener('updatefound', onUpdateFound);
    }).catch(() => {});

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Periodic update check (every 60 minutes) — the browser also
    // checks on navigation, but this catches long-running tabs.
    const checkInterval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && mounted) {
          reg.update().catch(() => {});
          checkWaiting(reg);
        }
      }).catch(() => {});
    }, 60 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(checkInterval);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.removeEventListener('updatefound', onUpdateFound);
      }).catch(() => {});
    };
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4">
      <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-100 dark:border-slate-700 p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00A651]/10 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-[#00A651]">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
            <path d="M21 3v6h-6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Nouvelle version disponible
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Rechargez pour profiter des dernières améliorations.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleReload}
            className="px-3 py-1.5 rounded-lg bg-[#00A651] hover:bg-[#009148] text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Recharger
          </button>
          <button
            onClick={() => setShowUpdate(false)}
            className="px-3 py-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 text-[11px] transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
