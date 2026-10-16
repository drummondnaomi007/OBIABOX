// Visitor stats (Cloudflare Web Analytics): page views only, no cookies, no
// personal data. Switched on by cloudflareAnalyticsToken in js/config.js.
// Skipped when opened from disk, on localhost, and for visitors who ask not to be
// tracked (Do Not Track or Global Privacy Control).
(function () {
  var cfg = window.OBIAB_CONFIG || {};
  var token = cfg.cloudflareAnalyticsToken;
  if (!token) return;
  var host = window.location.hostname;
  var local = window.location.protocol === "file:" || host === "localhost" || host === "127.0.0.1";
  if (local && !cfg.analyticsOnLocalhost) return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;

  var s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token: token }));
  s.setAttribute("data-obiab-analytics", "cloudflare");
  document.head.appendChild(s);
})();
