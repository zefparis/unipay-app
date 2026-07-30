'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WalletNotification {
  id:         string;
  type:       string;
  title_fr:   string;
  title_en:   string;
  body_fr:    string;
  body_en:    string;
  data:       Record<string, unknown>;
  read:       boolean;
  created_at: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array(Array.from(rawData).map((c) => c.charCodeAt(0)));
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification !== 'undefined') return Notification.permission;
    return 'default';
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscribed, setSubscribed]   = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/notifications/unread-count');
      if (res.ok) {
        const { count } = await res.json();
        setUnreadCount(Number(count ?? 0));
      }
    } catch { /* network errors ignored */ }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    let interval: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      if (interval) return;
      interval = setInterval(fetchUnreadCount, 60_000);
    }

    function stopPolling() {
      if (interval) { clearInterval(interval); interval = null; }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
        startPolling();
      } else {
        stopPolling();
      }
    }

    if (document.visibilityState === 'visible') {
      startPolling();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchUnreadCount]);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    try {
      const res = await fetch('/api/wallet/push/vapid-key');
      if (!res.ok) return false;
      const { publicKey } = await res.json();
      if (!publicKey) return false;

      const reg          = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });

      const json = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const subRes = await fetch('/api/wallet/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          endpoint:  json.endpoint,
          keys:      json.keys,
          userAgent: navigator.userAgent,
        }),
      });

      setSubscribed(subRes.ok);
      return subRes.ok;
    } catch {
      return false;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof Notification === 'undefined') return 'denied';

    const perm = await Notification.requestPermission();
    setPermission(perm);

    if (perm === 'granted') {
      await subscribeToPush();
    }

    return perm;
  }, [subscribeToPush]);

  const markRead = useCallback(async (id?: string) => {
    await fetch('/api/wallet/notifications/read', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(id ? { id } : {}),
    });
    setUnreadCount(0);
  }, []);

  return {
    permission,
    unreadCount,
    subscribed,
    requestPermission,
    subscribeToPush,
    fetchUnreadCount,
    markRead,
  };
}
