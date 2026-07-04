/// <reference lib="webworker" />

interface PushPayload {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

const ctx = self as unknown as ServiceWorkerGlobalScope;

ctx.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload = {};

  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: 'UniPay', body: event.data.text() };
  }

  event.waitUntil(
    ctx.registration.showNotification(payload.title ?? 'UniPay Congo', {
      body:    payload.body    ?? '',
      icon:    payload.icon   ?? '/icons/icon-192.png',
      badge:   payload.badge  ?? '/icons/icon-192.png',
      tag:     payload.tag    ?? 'unipay',
      data:    payload.data   ?? {},
      vibrate: [200, 100, 200],
    } as NotificationOptions & { vibrate?: number[] })
  );
});

ctx.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  event.waitUntil(
    ctx.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList: readonly Client[]) => {
        for (const client of clientList) {
          if ('focus' in client) return (client as Client & { focus: () => Promise<Client> }).focus();
        }
        return ctx.clients.openWindow('/fr/wallet');
      })
  );
});
