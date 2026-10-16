// Version check. version.json is the single source of truth.
// - Every page carries <meta name="obiab-site-version">; the app mockups page
//   also carries <meta name="obiab-app-version">.
// - The footer shows the website and app versions and whether they're in sync.
// - If this page is older than the published version.json (stale cache or a
//   half-finished deploy), or the mockups don't match the app version, a banner
//   says so up front.
// - Once the real app exists, set "appVersionUrl" in version.json to the URL of
//   the app's own version file and the live app is checked too.
(function () {
  function meta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute("content") : null;
  }

  // "1.4.2" -> "1.4": website and app are in sync when major.minor match.
  function majorMinor(v) {
    return String(v || "").split(".").slice(0, 2).join(".");
  }

  function versionFileUrl() {
    var script = document.querySelector('script[src$="js/version.js"]');
    return script ? script.src.replace(/js\/version\.js.*$/, "version.json") : "version.json";
  }

  function banner(kind, html) {
    var bar = document.createElement("div");
    bar.className = "version-banner " + kind;
    bar.setAttribute("role", "status");
    bar.setAttribute("data-version-banner", kind);
    bar.innerHTML = html;
    var close = document.createElement("button");
    close.type = "button";
    close.className = "version-banner-close";
    close.setAttribute("aria-label", "Dismiss");
    close.textContent = "×";
    close.addEventListener("click", function () {
      bar.remove();
    });
    bar.appendChild(close);
    document.body.insertBefore(bar, document.body.firstChild);
    return bar;
  }

  function render(info, state) {
    var el = document.querySelector("[data-version-info]");
    if (!el) return;
    el.innerHTML = "";
    var link = document.createElement("a");
    link.href = info.changelogHref;
    link.textContent = "Website v" + info.site + " · App v" + (info.app || "?");
    el.appendChild(link);
    var pill = document.createElement("span");
    pill.className = "version-pill " + state;
    pill.setAttribute("data-version-state", state);
    pill.textContent = state === "in-sync" ? "In sync" : state === "out-of-sync" ? "Out of sync" : "Checking…";
    el.appendChild(pill);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var pageSite = meta("obiab-site-version");
    var pageApp = meta("obiab-app-version");
    var url = versionFileUrl();
    var info = {
      site: pageSite || "?",
      app: null,
      changelogHref: url.replace(/version\.json$/, "changelog.html")
    };
    render(info, "checking");

    fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("version.json " + r.status);
        return r.json();
      })
      .then(function (v) {
        info.app = v.app;
        var problems = [];

        if (pageSite && v.site !== pageSite) {
          problems.push("site");
          banner(
            "stale",
            "<strong>This page is out of date.</strong> You're seeing website v" + pageSite +
              " but v" + v.site + " is live. <a href=\"#\" data-version-refresh>Refresh to update</a>."
          );
          var refresh = document.querySelector("[data-version-refresh]");
          if (refresh) {
            refresh.addEventListener("click", function (e) {
              e.preventDefault();
              window.location.reload();
            });
          }
        }

        if (pageApp && v.app !== pageApp) {
          problems.push("mockups");
          banner(
            "mismatch",
            "<strong>Heads up:</strong> these mockups show app v" + pageApp +
              ", but the app is now v" + v.app + ". Some screens may not match."
          );
        }

        if (!v.appVersionUrl) {
          render(info, problems.length ? "out-of-sync" : "in-sync");
          return null;
        }
        // The live app publishes its own version file.
        return fetch(v.appVersionUrl, { cache: "no-store" })
          .then(function (r) {
            return r.json();
          })
          .then(function (live) {
            info.app = live.version || live.app || v.app;
            if (majorMinor(info.app) !== majorMinor(v.app)) {
              problems.push("app");
              banner(
                "mismatch",
                "<strong>Heads up:</strong> this website describes app v" + v.app +
                  ", but the live app is v" + info.app + ". Some details may have changed."
              );
            }
            render(info, problems.length ? "out-of-sync" : "in-sync");
          })
          .catch(function () {
            render(info, problems.length ? "out-of-sync" : "in-sync");
          });
      })
      .catch(function () {
        // Opened straight from disk or offline: just show the page's own version.
        var el = document.querySelector("[data-version-info]");
        if (el) el.textContent = "Website v" + info.site;
      });
  });
})();
