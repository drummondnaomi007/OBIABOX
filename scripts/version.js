// Website / app version tool. version.json is the single source of truth.
//
//   npm run version:check                 check every page matches version.json
//   npm run version:bump -- site patch    bump the website (patch | minor | major)
//   npm run version:bump -- app minor     bump the app (also bumps the website patch,
//                                         because the mockups page changes)
//   npm run version:bump -- both minor    bump both to the next minor
//   node scripts/version.js site-url https://obiab.tradiesbureau.com/
//                                         move every share link and the sitemap to a new web address
//
// Rules: the website and the app are "in sync" when their major.minor match the
// pair recorded in version.json, every page carries the current website version,
// the app mockups carry the current app version, and What's new (changelog.html)
// has an entry for the current website version.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const versionFile = path.join(root, "version.json");
const changelog = path.join(root, "changelog.html");
const appPage = path.join(root, "demo", "app.html");
const SEMVER = /^\d+\.\d+\.\d+$/;

function htmlPages() {
  const pages = [];
  for (const dir of ["", "demo"]) {
    for (const f of fs.readdirSync(path.join(root, dir))) {
      if (f.endsWith(".html")) pages.push(path.join(root, dir, f));
    }
  }
  return pages;
}

function readJson() {
  return JSON.parse(fs.readFileSync(versionFile, "utf8"));
}

function rel(p) {
  return path.relative(root, p).split(path.sep).join("/");
}

function metaValue(html, name) {
  const m = html.match(new RegExp('<meta name="' + name + '" content="([^"]*)"'));
  return m ? m[1] : null;
}

function check() {
  const v = readJson();
  const problems = [];
  if (!SEMVER.test(v.site)) problems.push(`version.json: site "${v.site}" isn't like 1.2.3`);
  if (!SEMVER.test(v.app)) problems.push(`version.json: app "${v.app}" isn't like 1.2.3`);

  for (const page of htmlPages()) {
    const html = fs.readFileSync(page, "utf8");
    const site = metaValue(html, "obiab-site-version");
    if (site !== v.site) problems.push(`${rel(page)}: website version is ${site || "missing"}, expected ${v.site}`);
    if (!/<script src="(\.\.\/)?js\/version\.js"><\/script>/.test(html)) problems.push(`${rel(page)}: js/version.js isn't loaded`);
    if (!html.includes("data-version-info")) problems.push(`${rel(page)}: footer has no version slot`);
  }

  // Share links and sitemap all use the web address in version.json.
  if (!v.siteUrl || !/^https:\/\/.+\/$/.test(v.siteUrl)) problems.push('version.json: siteUrl should look like "https://example.com/"');
  else {
    for (const page of htmlPages()) {
      const html = fs.readFileSync(page, "utf8");
      const og = html.match(/<meta property="og:url" content="([^"]*)"/);
      if (!og || !og[1].startsWith(v.siteUrl)) problems.push(`${rel(page)}: share link (og:url) doesn't use ${v.siteUrl}`);
    }
    for (const f of ["sitemap.xml", "robots.txt"]) {
      const text = fs.readFileSync(path.join(root, f), "utf8");
      if (!text.includes(v.siteUrl)) problems.push(`${f}: doesn't use ${v.siteUrl}`);
    }
  }

  const app = metaValue(fs.readFileSync(appPage, "utf8"), "obiab-app-version");
  if (app !== v.app) problems.push(`demo/app.html: app mockups are ${app || "missing"}, expected ${v.app}`);

  const log = fs.existsSync(changelog) ? fs.readFileSync(changelog, "utf8") : "";
  const first = log.match(/data-version="([^"]+)"/);
  if (!first) problems.push("changelog.html: no releases found");
  else if (first[1] !== v.site) problems.push(`changelog.html: latest entry is ${first[1]}, expected ${v.site}`);
  if (log.includes("TODO")) problems.push("changelog.html: fill in the TODO in the latest entry");

  console.log(`Website v${v.site} · App v${v.app}`);
  if (problems.length) {
    console.log(`\nOut of sync (${problems.length}):`);
    for (const p of problems) console.log("  ✘ " + p);
    console.log("\nFix: npm run version:bump -- <site|app|both> <patch|minor|major>, then fill in What's new.");
    process.exitCode = 1;
  } else {
    console.log("✓ In sync: every page, the app mockups and What's new match version.json");
  }
}

function next(version, part) {
  const [ma, mi, pa] = version.split(".").map(Number);
  if (part === "major") return `${ma + 1}.0.0`;
  if (part === "minor") return `${ma}.${mi + 1}.0`;
  if (part === "patch") return `${ma}.${mi}.${pa + 1}`;
  throw new Error(`Unknown part "${part}". Use patch, minor or major.`);
}

function setMeta(file, name, value) {
  const html = fs.readFileSync(file, "utf8");
  const re = new RegExp('(<meta name="' + name + '" content=")[^"]*(")');
  if (!re.test(html)) throw new Error(`${rel(file)} has no ${name} meta tag`);
  fs.writeFileSync(file, html.replace(re, `$1${value}$2`));
}

function bump(which, part) {
  if (!["site", "app", "both"].includes(which)) throw new Error('First word must be "site", "app" or "both".');
  const v = readJson();
  const before = { site: v.site, app: v.app };
  if (which === "app" || which === "both") v.app = next(v.app, part);
  if (which === "site" || which === "both") v.site = next(v.site, part);
  else v.site = next(v.site, "patch"); // app-only change still changes the mockups page
  v.released = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(versionFile, JSON.stringify(v, null, 2) + "\n");

  for (const page of htmlPages()) setMeta(page, "obiab-site-version", v.site);
  setMeta(appPage, "obiab-app-version", v.app);

  const log = fs.readFileSync(changelog, "utf8");
  const entry =
    `    <article class="release" data-version="${v.site}">\n` +
    `      <h2>Website v${v.site} · App v${v.app}</h2>\n` +
    `      <p class="release-date">${v.released}</p>\n` +
    `      <ul>\n        <li>TODO: say what changed, in plain words.</li>\n      </ul>\n` +
    `    </article>\n\n`;
  fs.writeFileSync(changelog, log.replace("<!-- releases -->\n", "<!-- releases -->\n" + entry));

  console.log(`Website ${before.site} → ${v.site} · App ${before.app} → ${v.app}`);
  console.log("Next: write what changed in changelog.html (replace the TODO), then run npm run version:check.");
}

function siteUrl(url) {
  if (!/^https:\/\/.+\/$/.test(url || "")) throw new Error('Give the full address ending in "/", e.g. https://obiab.tradiesbureau.com/');
  const v = readJson();
  const old = v.siteUrl;
  const files = htmlPages().concat([path.join(root, "sitemap.xml"), path.join(root, "robots.txt")]);
  for (const f of files) fs.writeFileSync(f, fs.readFileSync(f, "utf8").split(old).join(url));
  v.siteUrl = url;
  fs.writeFileSync(versionFile, JSON.stringify(v, null, 2) + "\n");
  console.log(`Web address ${old} → ${url} in ${files.length} files.`);
  console.log("Also add a CNAME file with the domain, and note it in What's new.");
}

const [cmd, a, b] = process.argv.slice(2);
try {
  if (cmd === "bump") bump(a, b);
  else if (cmd === "site-url") siteUrl(a);
  else check();
} catch (e) {
  console.error("✘ " + e.message);
  process.exitCode = 1;
}
