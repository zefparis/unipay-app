// @ts-nocheck
/// <reference lib="webworker" />

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, unknown>;
  } = {};

  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'UniPay', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'UniPay Congo', {
      body:    payload.body    ?? '',
      icon:    payload.icon   ?? '/icons/icon-192.png',
      badge:   payload.badge  ?? '/icons/icon-192.png',
      tag:     payload.tag    ?? 'unipay',
      data:    payload.data   ?? {},
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        return self.clients.openWindow('/fr/wallet');
      })
  );
});
