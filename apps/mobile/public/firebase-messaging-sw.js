// Register before Firebase so an order notification opens its authenticated tracking page.
self.addEventListener("notificationclick", (event) => {
  const data = event.notification.data;
  const orderId = data?.FCM_MSG?.data?.orderId ?? data?.orderId;
  if (typeof orderId !== "string" || !/^[a-f0-9]{24}$/i.test(orderId)) return;
  event.stopImmediatePropagation();
  event.notification.close();
  const url = new URL(`/tracking/?orderId=${encodeURIComponent(orderId)}`, self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const client = windows.find((item) => new URL(item.url).origin === self.location.origin);
    if (client) { await client.navigate(url); await client.focus(); }
    else await self.clients.openWindow(url);
  })());
});
/* Public Firebase web configuration is supplied at registration. */
importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js",
);
const config = new URL(self.location.href).searchParams.get("config");
if (config) {
  firebase.initializeApp(JSON.parse(config));
  firebase.messaging();
}
