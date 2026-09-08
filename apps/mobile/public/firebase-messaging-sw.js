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
