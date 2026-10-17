// Build the demo portal as ONE self-contained HTML file, for sharing as a
// claude.ai Artifact (which can't load files from this site).
//
//   node scripts/build-portal-artifact.js [output.html]
//   (default: dist/obiabox-portal.html)
//
// It inlines portal-base.css, portal.css, js/house.js and portal/portal.js,
// embeds the logo images, points links at the live website (siteUrl in
// version.json) and writes the app version into the footer. The Artifact
// host adds its own <html>/<head>/<body>, so the file starts at <title>.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const out = path.resolve(process.argv[2] || path.join(root, "dist", "obiabox-portal.html"));
const v = JSON.parse(read("version.json"));
const svgData = (p) => "data:image/svg+xml;base64," + Buffer.from(read(p)).toString("base64");
// Keep inline scripts from ending the <script> tag early.
const safeScript = (js) => js.replace(/<\/script/gi, "<\\/script");

const env = {
  siteBase: v.siteUrl,
  logo: svgData("assets/logo.svg"),
  mark: svgData("assets/favicon.svg"),
  appVersion: v.app
};

const html = `<title>OBIABOX Demo Portal</title>
<meta name="description" content="A working demo of the Owner Builder in a Box portal, for review. Sample data stays in your browser.">
<style>
${read("portal/portal-base.css")}
${read("portal/portal.css")}
</style>
<script>
window.OBIAB_PORTAL = ${JSON.stringify(env)};
document.body.classList.add("portal");
document.body.setAttribute("data-no-tracker", "");
</script>
<a class="skip-link" href="#main">Skip to content</a>
<div class="pt-demo-bar" role="note">
  <span><strong>Demo portal for review.</strong> Sample data, saved only in this browser.</span>
  <span class="pt-demo-actions">
    <button type="button" class="pt-linkbtn" data-action="reset-demo">Reset demo</button>
    <a href="${v.siteUrl}" target="_blank" rel="noopener">Owner Builder in a Box website</a>
  </span>
</div>

<div id="app" class="pt-app" aria-live="off"></div>

<noscript>
  <main id="main" class="pt-noscript">
    <h1>The demo portal needs JavaScript</h1>
    <p>Turn JavaScript on to try it, or see the <a href="${v.siteUrl}features.html">features</a>.</p>
  </main>
</noscript>

<div class="pt-toast" role="status" aria-live="polite" data-toast hidden></div>

<footer class="pt-footer">
  <span>&copy; ${new Date().getFullYear()} Tradies Bureau. Demo only, not legal or building advice.</span>
  <span class="footer-meta"><a href="${v.siteUrl}privacy.html" target="_blank" rel="noopener">Privacy</a><span class="version-info">App v${v.app} · Website v${v.site}</span></span>
</footer>

<script>
${safeScript(read("js/house.js"))}
</script>
<script>
${safeScript(read("portal/portal.js"))}
</script>
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Built ${path.relative(process.cwd(), out) || out} (${Math.round(html.length / 1024)} KB) · App v${v.app}`);
