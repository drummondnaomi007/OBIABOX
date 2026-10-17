// OBIABOX demo portal. A working, clickable demo of the Owner Builder in a Box
// app for review. Everything runs in the browser: data is sample data saved in
// localStorage (with an in-memory fallback), and nothing is sent anywhere.
//
// Structure: state + seed data → render(route) → event delegation (data-action,
// data-form) → actions mutate state → save → render.
(function () {
  "use strict";

  var STORE_KEY = "obiabox-portal-demo-v1";
  var memory = null;

  // Where the rest of the site lives. On GitHub Pages it's next door ("../");
  // the single-file Artifact build sets absolute links and inline images.
  var ENV = window.OBIAB_PORTAL || {};
  var SITE = ENV.siteBase || "../";
  var LOGO = ENV.logo || SITE + "assets/logo.svg";
  var MARK = ENV.mark || SITE + "assets/favicon.svg";

  // ---------- helpers ----------

  var DAY = 86400000;
  function today() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // ISO date n days from today.
  function days(n) {
    var d = today();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function daysUntil(iso) {
    if (!iso) return null;
    return Math.round((new Date(iso + "T00:00:00") - today()) / DAY);
  }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  function fmt(iso) {
    if (!iso) return "—";
    var d = new Date(iso + "T00:00:00");
    return d.getDate() + " " + MONTHS[d.getMonth()];
  }
  function fmtDay(iso) {
    var d = new Date(iso + "T00:00:00");
    return WEEKDAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()];
  }
  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-AU");
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  var idn = 0;
  function uid(prefix) {
    idn += 1;
    return (prefix || "id") + "-" + Date.now().toString(36) + "-" + idn;
  }
  function pill(kind, text) {
    return '<span class="pill pill-' + kind + '">' + esc(text) + "</span>";
  }
  function nowStamp() {
    var d = new Date();
    return fmt(d.toISOString().slice(0, 10)) + " · " + d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
  }

  // Expiry → status for anything with a date.
  function expiryStatus(iso, missing) {
    if (missing) return { kind: "red", text: "Missing", rank: 0 };
    if (!iso) return { kind: "green", text: "On file", rank: 3 };
    var n = daysUntil(iso);
    if (n < 0) return { kind: "red", text: "Expired " + fmt(iso), rank: 0 };
    if (n <= 30) return { kind: "amber", text: n === 0 ? "Expires today" : "Expires in " + n + " day" + (n === 1 ? "" : "s"), rank: 1 };
    return { kind: "green", text: "Current to " + fmt(iso), rank: 3 };
  }

  // ---------- sample data ----------

  function seed() {
    return {
      version: 1,
      started: false,
      user: "",
      project: {
        address: "12 Smith Street",
        suburb: "Exampleton VIC",
        council: "City of Example",
        work: "New single-storey dwelling",
        owner: "Sam Taylor",
        phone: "0400 000 000",
        surveyor: "Example Building Surveying",
        permit: "BP-0000",
        budget: 440000
      },
      compliance: [
        { id: "c1", name: "Certificate of Consent", group: "Approvals", ref: "CC-00000", expires: null },
        { id: "c2", name: "Building permit", group: "Approvals", ref: "BP-0000", expires: days(300) },
        { id: "c3", name: "Asset protection permit", group: "Approvals", ref: "AP-0000", expires: days(160) },
        { id: "c4", name: "White Card: Sam Taylor", group: "Tickets", ref: "WC-000000", expires: null },
        { id: "c5", name: "Construction insurance", group: "Insurance", ref: "Policy 000-111", expires: days(230) },
        { id: "c6", name: "Public liability: owner", group: "Insurance", ref: "Policy 000-222", expires: days(24) },
        { id: "c7", name: "Owner builder eLearning assessment", group: "Tickets", ref: "Completed", expires: null },
        { id: "c8", name: "Domestic building insurance for selling", group: "Insurance", ref: "", expires: null, optional: true, note: "Only needed if you sell soon after finishing. Check the rules for your state." }
      ],
      inspections: [
        { id: "i1", name: "Footings", status: "passed", date: days(-60), checklist: [] },
        { id: "i2", name: "Slab (pre-pour)", status: "passed", date: days(-41), checklist: [] },
        {
          id: "i3",
          name: "Frame",
          status: "ready",
          date: null,
          checklist: [
            { text: "Wall frames and roof trusses complete", done: true },
            { text: "Bracing and tie-downs installed to the engineering plans", done: true },
            { text: "Roof truss design certificate uploaded", done: false },
            { text: "Nothing lined or covered yet", done: true }
          ]
        },
        {
          id: "i4",
          name: "Final",
          status: "todo",
          date: null,
          checklist: [
            { text: "All end-of-job certificates collected", done: false },
            { text: "Smoke alarms installed and working", done: false },
            { text: "Stairs, balustrades and safety barriers complete", done: false }
          ]
        }
      ],
      slots: [days(2) + " 10:00am", days(3) + " 8:00am", days(4) + " 1:30pm"],
      trades: [
        { id: "t1", trade: "Excavation", business: "Example Earthworks", licence: "Registered", insurance: days(200), workcover: true, tb: true, cert: "none" },
        { id: "t2", trade: "Concreting", business: "Solid Slab Co", licence: "Registered", insurance: days(140), workcover: true, tb: false, cert: "none" },
        { id: "t3", trade: "Frame carpentry", business: "Northside Framing", licence: "Registered", insurance: days(21), workcover: true, tb: true, cert: "none" },
        { id: "t4", trade: "Plumbing", business: "Flowright Plumbing", licence: "Registered", insurance: days(260), workcover: true, tb: true, cert: "due" },
        { id: "t5", trade: "Electrical", business: "Bright Spark Electrical", licence: "Licensed", insurance: null, workcover: true, tb: false, cert: "due" },
        { id: "t6", trade: "Roofing", business: "Top Deck Roofing", licence: "Registered", insurance: days(180), workcover: true, tb: false, cert: "due" }
      ],
      tender: {
        name: "Waterproofing",
        closes: days(5),
        quotes: [
          { id: "q1", business: "DrySeal Waterproofing", price: 4850, includes: "Bathroom, ensuite and laundry", excludes: "Tiling", start: days(30), compliance: "ok", tb: true },
          { id: "q2", business: "Wet Area Pros", price: 4200, includes: "Bathroom and ensuite", excludes: "Laundry, tiling", start: days(45), compliance: "warn", tb: false },
          { id: "q3", business: "Budget Membranes", price: 2990, includes: "Labour only", excludes: "Membrane, primer, tiling", start: null, compliance: "bad", tb: false }
        ],
        awarded: null
      },
      contracts: [
        {
          id: "k1",
          trade: "Frame carpentry",
          business: "Northside Framing",
          sum: 35900,
          payments: [
            { name: "Deposit", amount: 1795, status: "paid" },
            { name: "Wall frames up", amount: 16155, status: "paid" },
            { name: "Frame complete", amount: 8975, status: "waiting", inspection: "i3" },
            { name: "Practical completion", amount: 8975, status: "later" }
          ],
          variations: [
            { id: "v1", text: "Larger lintel, rear opening", amount: 850, status: "approved", when: fmt(days(-20)) },
            { id: "v2", text: "Extra noggins for kitchen cabinets", amount: 400, status: "pending", when: fmt(days(-2)) }
          ]
        },
        {
          id: "k2",
          trade: "Plumbing",
          business: "Flowright Plumbing",
          sum: 28400,
          payments: [
            { name: "Deposit", amount: 1420, status: "paid" },
            { name: "Rough-in", amount: 12000, status: "paid" },
            { name: "Fit-off", amount: 12000, status: "later" },
            { name: "Compliance certificate received", amount: 2980, status: "later" }
          ],
          variations: []
        }
      ],
      otherCommitted: 340400,
      neighbours: {
        subscribers: [
          { addr: "10 Smith St", channel: "SMS" },
          { addr: "11 Smith St", channel: "SMS" },
          { addr: "15 Smith St", channel: "Email" }
        ],
        updates: [
          { id: "u1", type: "Letterbox drop", when: days(-70), note: "Project notice with QR code", reached: 12 },
          { id: "u2", type: "Machinery", when: days(-61), note: "Excavator on site, 7am to 3pm", reached: 2 },
          { id: "u3", type: "Trucks", when: days(-41), note: "Slab pour: concrete trucks and pump from 7am", reached: 3 }
        ],
        dropArea: "block",
        dropped: { s8: true, s10: true, s11: true, s14: true, s15: true, s16: true }
      },
      asset: {
        permit: "AP-0000",
        bond: 3000,
        bondPaid: days(-75),
        photos: [
          { key: "footpath", label: "Footpath", taken: fmt(days(-72)) + " · 7:41am" },
          { key: "kerb", label: "Kerb & channel", taken: fmt(days(-72)) + " · 7:43am" },
          { key: "crossover", label: "Vehicle crossover", taken: fmt(days(-72)) + " · 7:44am" },
          { key: "pits", label: "Service pits", taken: fmt(days(-72)) + " · 7:46am" },
          { key: "tree", label: "Street tree", taken: null },
          { key: "strip", label: "Nature strip", taken: null }
        ],
        stage: 1 // 0 paid, 1 before photos, 2 works, 3 after photos, 4 final inspection, 5 refunded
      },
      dilapidation: [
        { id: "d1", addr: "10 Smith St", adjoining: true, pre: fmt(days(-74)), by: "ABC Inspections", copy: true, refused: false, post: false },
        { id: "d2", addr: "14 Smith St", adjoining: true, pre: null, by: "", copy: false, refused: false, post: false },
        { id: "d3", addr: "3 Back Lane (rear)", adjoining: true, pre: null, by: "", copy: false, refused: true, post: false }
      ],
      documents: [
        { id: "f1", name: "Certificate of Consent", folder: "Approvals & permits", date: days(-120), handover: true },
        { id: "f2", name: "Building permit BP-0000", folder: "Approvals & permits", date: days(-95), handover: true },
        { id: "f3", name: "Asset protection permit + bond receipt", folder: "Neighbours & council", date: days(-75), handover: true },
        { id: "f4", name: "Architectural plans rev C", folder: "Plans & engineering", date: days(-100), handover: true },
        { id: "f5", name: "Architectural plans rev B", folder: "Plans & engineering", date: days(-130), handover: false, superseded: true },
        { id: "f6", name: "Structural engineering", folder: "Plans & engineering", date: days(-100), handover: true },
        { id: "f7", name: "Contract: Northside Framing", folder: "Trades & contracts", date: days(-30), handover: true },
        { id: "f8", name: "Contract: Flowright Plumbing", folder: "Trades & contracts", date: days(-50), handover: true },
        { id: "f9", name: "Footings inspection: passed", folder: "Inspections", date: days(-60), handover: true },
        { id: "f10", name: "Slab inspection: passed", folder: "Inspections", date: days(-41), handover: true },
        { id: "f11", name: "Dilapidation report: 10 Smith St", folder: "Neighbours & council", date: days(-74), handover: true },
        { id: "f12", name: "Before photos (4)", folder: "Neighbours & council", date: days(-72), handover: true }
      ],
      handoverNeeded: [
        "Roof truss design certificate",
        "Final inspection certificate",
        "Plumbing compliance certificate",
        "Electrical safety certificate",
        "Waterproofing certificate",
        "Dilapidation report: 14 Smith St"
      ],
      notes: []
    };
  }

  function blankProject(p) {
    var s = seed();
    s.project = {
      address: p.address,
      suburb: p.suburb,
      council: p.council,
      work: p.work,
      owner: p.owner,
      phone: "",
      surveyor: "",
      permit: "",
      budget: Number(p.budget) || 0
    };
    s.compliance = [
      { id: "c1", name: "Certificate of Consent", group: "Approvals", ref: "", expires: null, missing: true },
      { id: "c2", name: "Building permit", group: "Approvals", ref: "", expires: null, missing: true },
      { id: "c3", name: "White Card", group: "Tickets", ref: "", expires: null, missing: true },
      { id: "c4", name: "Construction insurance", group: "Insurance", ref: "", expires: null, missing: true }
    ];
    s.inspections.forEach(function (i) {
      i.status = "todo";
      i.date = null;
      i.checklist.forEach(function (c) {
        c.done = false;
      });
    });
    s.inspections[0].status = "ready";
    s.inspections[0].checklist = [
      { text: "Footing trenches dug to the plans", done: false },
      { text: "Reinforcement in place", done: false },
      { text: "Nothing poured yet", done: false }
    ];
    s.trades = [];
    s.tender = { name: "Excavation", closes: days(14), quotes: [], awarded: null };
    s.contracts = [];
    s.otherCommitted = 0;
    s.neighbours = { subscribers: [], updates: [], dropArea: "block", dropped: {} };
    s.asset.photos.forEach(function (ph) {
      ph.taken = null;
    });
    s.asset.stage = 0;
    s.asset.bondPaid = null;
    s.dilapidation.forEach(function (d) {
      d.pre = null;
      d.by = "";
      d.copy = false;
      d.refused = false;
    });
    s.documents = [];
    s.handoverNeeded = ["Certificate of Consent", "Building permit", "Final inspection certificate"];
    return s;
  }

  // ---------- storage ----------

  function load() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1) return parsed;
      }
    } catch (e) {
      if (memory) return memory;
    }
    return seed();
  }

  function save() {
    memory = state;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      /* demo still works for this visit */
    }
  }

  var state = load();

  // ---------- screen state (not saved) ----------

  var ui = {
    route: "dashboard",
    tradesTab: "register",
    docFolder: "All",
    docQuery: "",
    notesOpen: false,
    navOpen: false,
    editing: null,
    composeType: "Trucks",
    shareLink: null,
    setup: false,
    confirmReset: false,
    commentsReady: false
  };

  var ROUTES = [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "compliance", label: "Compliance", icon: "✓" },
    { id: "inspections", label: "Inspections", icon: "🔍" },
    { id: "trades", label: "Trades & contracts", icon: "👷" },
    { id: "neighbours", label: "Neighbours", icon: "✉" },
    { id: "asset", label: "Asset protection", icon: "🛡" },
    { id: "dilapidation", label: "Dilapidation", icon: "🏘" },
    { id: "documents", label: "Documents", icon: "🗂" },
    { id: "project", label: "Project & sharing", icon: "⚙" }
  ];

  var FOLDERS = ["Approvals & permits", "Insurance", "Trades & contracts", "Inspections", "End-of-job certificates", "Neighbours & council", "Plans & engineering"];

  // ---------- derived data ----------

  function compStatus(c) {
    if (c.optional) return { kind: "grey", text: "Only if you sell", rank: 2 };
    return expiryStatus(c.expires, c.missing);
  }

  function complianceScore() {
    var list = state.compliance.filter(function (c) {
      return !c.optional;
    });
    if (!list.length) return { pct: 0, ok: 0, total: 0 };
    var ok = list.filter(function (c) {
      return compStatus(c).rank === 3;
    }).length;
    return { pct: Math.round((ok / list.length) * 100), ok: ok, total: list.length };
  }

  var STAGES = [
    { name: "Site set-out", progress: 0.05 },
    { name: "Slab", progress: 0.16 },
    { name: "Frame", progress: 0.32 },
    { name: "Lock-up", progress: 0.6 },
    { name: "Handover", progress: 1 }
  ];
  function stage() {
    var passed = state.inspections.filter(function (i) {
      return i.status === "passed";
    }).length;
    return STAGES[Math.min(passed, STAGES.length - 1)];
  }

  function nextInspection() {
    for (var i = 0; i < state.inspections.length; i++) {
      if (state.inspections[i].status !== "passed") return state.inspections[i];
    }
    return null;
  }

  function checklistDone(insp) {
    return insp.checklist.every(function (c) {
      return c.done;
    });
  }

  function tradeInsurance(t) {
    return expiryStatus(t.insurance, !t.insurance);
  }

  function handover() {
    var ready = state.documents.filter(function (d) {
      return d.handover && !d.superseded;
    }).length;
    var needed = state.handoverNeeded.length;
    var total = ready + needed;
    return { ready: ready, total: total, pct: total ? Math.round((ready / total) * 100) : 0, missing: state.handoverNeeded };
  }

  function contractTotals(k) {
    var approved = k.variations
      .filter(function (v) {
        return v.status === "approved";
      })
      .reduce(function (a, v) {
        return a + v.amount;
      }, 0);
    var paid = k.payments
      .filter(function (p) {
        return p.status === "paid";
      })
      .reduce(function (a, p) {
        return a + p.amount;
      }, 0);
    return { variations: approved, revised: k.sum + approved, paid: paid };
  }

  function committed() {
    return (
      state.otherCommitted +
      state.contracts.reduce(function (a, k) {
        return a + contractTotals(k).revised;
      }, 0)
    );
  }

  function pendingVariations() {
    var out = [];
    state.contracts.forEach(function (k) {
      k.variations.forEach(function (v) {
        if (v.status === "pending") out.push({ k: k, v: v });
      });
    });
    return out;
  }

  // Everything that needs attention, most urgent first.
  function dueNext() {
    var items = [];
    state.compliance.forEach(function (c) {
      var st = compStatus(c);
      if (st.rank < 2) items.push({ sev: st.rank, kind: st.kind, text: c.name, badge: st.text, route: "compliance" });
    });
    var insp = nextInspection();
    if (insp) {
      if (insp.status === "defects") items.push({ sev: 0, kind: "red", text: "Fix defects, then re-book: " + insp.name + " inspection", badge: "Defects", route: "inspections" });
      else if (insp.status === "booked") items.push({ sev: 2, kind: "green", text: insp.name + " inspection booked", badge: fmtDay(insp.date.slice(0, 10)), route: "inspections" });
      else if (insp.status === "ready" && checklistDone(insp)) items.push({ sev: 1, kind: "amber", text: "Book the " + insp.name.toLowerCase() + " inspection", badge: "Ready", route: "inspections" });
      else if (insp.status === "ready") items.push({ sev: 1, kind: "amber", text: "Get ready for the " + insp.name.toLowerCase() + " inspection", badge: "Checklist", route: "inspections" });
    }
    pendingVariations().forEach(function (x) {
      items.push({ sev: 1, kind: "amber", text: "Approve or query variation: " + x.v.text, badge: money(x.v.amount), route: "trades" });
    });
    state.contracts.forEach(function (k) {
      k.payments.forEach(function (p) {
        if (p.status === "due") items.push({ sev: 1, kind: "amber", text: "Payment ready to approve: " + k.business + " · " + p.name, badge: money(p.amount), route: "trades" });
      });
    });
    state.trades.forEach(function (t) {
      var st = tradeInsurance(t);
      if (st.rank < 2) items.push({ sev: st.rank, kind: st.kind, text: t.business + ": public liability", badge: st.text, route: "trades" });
    });
    state.dilapidation.forEach(function (d) {
      if (!d.pre && !d.refused) items.push({ sev: 0, kind: "red", text: "Dilapidation report needed: " + d.addr, badge: "Before works", route: "dilapidation" });
    });
    var missingPhotos = state.asset.photos.filter(function (p) {
      return !p.taken;
    }).length;
    if (state.asset.stage <= 1 && missingPhotos) items.push({ sev: 1, kind: "amber", text: "Take before photos out the front", badge: missingPhotos + " to go", route: "asset" });
    if (!state.tender.awarded && state.tender.quotes.length)
      items.push({ sev: 2, kind: "grey", text: "Choose a " + state.tender.name.toLowerCase() + " quote", badge: "Closes " + fmt(state.tender.closes), route: "trades" });
    return items.sort(function (a, b) {
      return a.sev - b.sev;
    });
  }

  function badgeFor(route) {
    var n = dueNext().filter(function (i) {
      return i.route === route && i.sev < 2;
    }).length;
    return n ? '<span class="pt-badge" aria-label="' + n + ' need attention">' + n + "</span>" : "";
  }

  // ---------- shell ----------

  function confirmStrip() {
    if (!ui.confirmReset) return "";
    return (
      '<div class="pt-confirm" role="alertdialog" aria-labelledby="pt-confirm-text">' +
      '<p id="pt-confirm-text"><strong>Reset the demo?</strong> Your changes to the sample project will be lost. Review notes are kept.</p>' +
      '<div class="pt-actions"><button type="button" class="btn btn-primary pt-btn-sm" data-action="reset-yes">Reset demo</button>' +
      '<button type="button" class="btn btn-outline pt-btn-sm" data-action="reset-no">Keep my changes</button></div></div>'
    );
  }

  function renderLogin() {
    var p = state.project;
    return (
      confirmStrip() +
      '<main id="main" class="pt-login" tabindex="-1">' +
      '<div class="pt-login-card">' +
      '<div class="pt-login-brand"><img src="' + MARK + '" alt="" width="40" height="40"><span>Owner Builder in a Box</span></div>' +
      "<h1>Sign in</h1>" +
      '<p class="pt-muted">In the real app you\'d get a sign-in link by email, so there\'s no password to remember. For this demo, pick how you\'d like to start.</p>' +
      '<form data-form="signin" class="pt-form">' +
      '<label for="pt-email">Your email (optional)</label>' +
      '<input id="pt-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" value="' + esc(state.user) + '">' +
      '<button type="submit" class="btn btn-primary" name="mode" value="sample">Open the sample project</button>' +
      "</form>" +
      '<p class="pt-muted pt-small">The sample project is ' + esc(p.address) + ", mid-build at frame stage, with trades, inspections and neighbours already set up.</p>" +
      '<hr class="pt-rule">' +
      (ui.setup
        ? '<form data-form="setup" class="pt-form">' +
          "<h2>Start a new project</h2>" +
          '<label for="s-address">Street address</label><input id="s-address" name="address" required placeholder="e.g. 5 Example Road">' +
          '<label for="s-suburb">Suburb and state</label><input id="s-suburb" name="suburb" required placeholder="e.g. Exampleton VIC">' +
          '<label for="s-council">Council</label><input id="s-council" name="council" required placeholder="e.g. City of Example">' +
          '<label for="s-work">What are you building?</label><select id="s-work" name="work"><option>New single-storey dwelling</option><option>New double-storey dwelling</option><option>Major renovation or extension</option><option>Granny flat / secondary dwelling</option></select>' +
          '<label for="s-owner">Your name</label><input id="s-owner" name="owner" required autocomplete="name">' +
          '<label for="s-budget">Budget (optional)</label><input id="s-budget" name="budget" type="number" min="0" step="1000" placeholder="e.g. 450000">' +
          '<button type="submit" class="btn btn-primary">Create my project</button>' +
          "</form>"
        : '<button type="button" class="btn btn-outline pt-wide" data-action="show-setup">Start a new project instead</button>') +
      "</div></main>"
    );
  }

  function renderShell(content) {
    var st = stage();
    var nav = ROUTES.map(function (r) {
      var current = r.id === ui.route;
      return (
        '<li><a href="#' + r.id + '"' + (current ? ' aria-current="page" class="on"' : "") + ' data-nav="' + r.id + '">' +
        '<span class="pt-nav-icon" aria-hidden="true">' + r.icon + "</span><span>" + r.label + "</span>" + badgeFor(r.id) + "</a></li>"
      );
    }).join("");
    return (
      '<div class="pt-shell' + (ui.navOpen ? " nav-open" : "") + '">' +
      '<nav class="pt-side" id="pt-nav" aria-label="Portal">' +
      '<div class="pt-brand"><img src="' + LOGO + '" alt="" width="34" height="34"><span>OBIABOX<small>Owner Builder in a Box</small></span></div>' +
      '<div class="pt-proj"><strong>' + esc(state.project.address) + "</strong><span>" + esc(state.project.suburb) + "</span></div>" +
      '<ul class="pt-nav">' + nav + "</ul>" +
      "</nav>" +
      '<div class="pt-body">' +
      '<header class="pt-top">' +
      '<button type="button" class="pt-menu" data-action="toggle-nav" aria-expanded="' + (ui.navOpen ? "true" : "false") + '" aria-controls="pt-nav">☰<span class="pt-sr"> Menu</span></button>' +
      '<div class="pt-top-title"><strong>' + esc(state.project.address) + '</strong> <span class="pill pill-amber">' + esc(st.name) + " stage</span></div>" +
      '<button type="button" class="pt-notes-btn" data-action="toggle-notes" aria-expanded="' + (ui.notesOpen ? "true" : "false") + '" aria-controls="pt-notes">📝 Review notes' + (state.notes.length ? ' <span class="pt-badge">' + state.notes.length + "</span>" : "") + "</button>" +
      '<button type="button" class="pt-linkbtn pt-signout" data-action="sign-out">Sign out</button>' +
      "</header>" +
      '<main id="main" class="pt-main" tabindex="-1">' + confirmStrip() + content + "</main>" +
      "</div>" +
      renderNotes() +
      "</div>"
    );
  }

  function renderNotes() {
    var route = ROUTES.filter(function (r) {
      return r.id === ui.route;
    })[0];
    var list = state.notes
      .slice()
      .reverse()
      .map(function (n) {
        return (
          '<li><div class="pt-note-meta"><span class="pill pill-grey">' + esc(n.screen) + "</span> " + esc(n.at) + "</div>" +
          "<p>" + esc(n.text) + "</p>" +
          '<button type="button" class="pt-linkbtn" data-action="delete-note" data-id="' + esc(n.id) + '">Delete</button></li>'
        );
      })
      .join("");
    return (
      '<aside class="pt-notes" id="pt-notes" aria-label="Review notes"' + (ui.notesOpen ? "" : " hidden") + ">" +
      '<div class="pt-notes-head"><h2>Review notes</h2><button type="button" class="pt-linkbtn" data-action="toggle-notes" aria-label="Close review notes">✕</button></div>' +
      (ui.commentsReady
        ? '<div class="pt-comment-box"><p><strong>Send feedback to the team.</strong> Your comment is pinned to this screen (' + esc(route ? route.label : ui.route) + ") and everyone reviewing can see it.</p>" +
          '<button type="button" class="btn btn-primary pt-btn-sm" data-action="comment">💬 Comment on this screen</button></div>' +
          '<p class="pt-label">Private notes</p>'
        : "") +
      '<p class="pt-muted pt-small">Spotted something? Leave a note. It\'s tagged with the screen you\'re on (' + esc(route ? route.label : ui.route) + "). Notes stay in this browser until you copy " + (ui.commentsReady ? "them" : "or download them") + ", and Reset demo keeps them.</p>" +
      '<form data-form="note" class="pt-form">' +
      '<label for="pt-note">Your note</label>' +
      '<textarea id="pt-note" name="text" rows="4" required placeholder="What works, what\'s confusing, what\'s missing?"></textarea>' +
      '<button type="submit" class="btn btn-primary">Add note</button>' +
      "</form>" +
      (state.notes.length
        ? '<div class="pt-note-actions"><button type="button" class="pt-btn" data-action="copy-notes">Copy all</button><button type="button" class="pt-btn" data-action="download-notes">Download (.txt)</button></div>' +
          '<ul class="pt-note-list">' + list + "</ul>"
        : '<p class="pt-muted pt-small">No notes yet.</p>') +
      "</aside>"
    );
  }

  function card(title, body, extra) {
    return '<section class="pt-card' + (extra ? " " + extra : "") + '"><h2>' + title + "</h2>" + body + "</section>";
  }

  function pageHead(title, sub, actions) {
    return '<div class="pt-head"><div><h1 tabindex="-1">' + title + "</h1>" + (sub ? '<p class="pt-muted">' + sub + "</p>" : "") + "</div>" + (actions || "") + "</div>";
  }

  // ---------- screens ----------

  var VIEWS = {};

  VIEWS.dashboard = function () {
    var st = stage();
    var score = complianceScore();
    var due = dueNext();
    var subs = state.neighbours.subscribers.length;
    var last = state.neighbours.updates[state.neighbours.updates.length - 1];
    var spent = committed();
    var budget = state.project.budget;
    var hour = new Date().getHours();
    var hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    var first = (state.project.owner || "").split(" ")[0];
    var stepNames = STAGES.map(function (s) {
      var cls = s.progress < st.progress ? "done" : s === st ? "now" : "";
      return '<span class="' + cls + '">' + esc(s.name) + "</span>";
    }).join("");
    var dueHtml = due.length
      ? '<ul class="pt-list" data-due-list>' +
        due.slice(0, 7).map(function (i) {
          return '<li><a href="#' + i.route + '">' + esc(i.text) + "</a>" + pill(i.kind, i.badge) + "</li>";
        }).join("") +
        "</ul>" +
        (due.length > 7 ? '<p class="pt-muted pt-small">+ ' + (due.length - 7) + " more on the other screens</p>" : "")
      : '<p class="pt-empty">Nothing due. Nice work.</p>';
    return (
      pageHead(hello + (first ? ", " + esc(first) : ""), esc(state.project.work) + " · " + esc(state.project.council)) +
      '<div class="pt-grid">' +
      card(
        "Build stage",
        '<div class="pt-house" data-house-progress="' + st.progress + '"></div><p class="pt-stage-name" data-stage>' + esc(st.name) + '</p><div class="pt-steps">' + stepNames + "</div>",
        "pt-center"
      ) +
      card("Due next", dueHtml) +
      card(
        "Compliance",
        '<div class="pt-score"><strong data-score>' + score.pct + "%</strong><span>" + score.ok + " of " + score.total + ' items current</span></div><div class="pt-bar"><span style="width:' + score.pct + '%"></span></div>' +
        '<p><a href="#compliance">See everything →</a></p>'
      ) +
      card(
        "Neighbours",
        '<div class="pt-score"><strong>' + subs + "</strong><span>signed up for updates</span></div>" +
        (last ? '<p class="pt-muted">Last update: ' + esc(last.type) + " · " + fmt(last.when) + "</p>" : '<p class="pt-muted">No updates sent yet.</p>') +
        '<a class="btn btn-primary pt-btn-sm" href="#neighbours">Send an update</a>'
      ) +
      card(
        "Money",
        (budget
          ? '<div class="pt-score"><strong>' + money(spent) + "</strong><span>committed of " + money(budget) + " budget</span></div>" +
            '<div class="pt-bar' + (spent > budget ? " over" : "") + '"><span style="width:' + Math.min(100, Math.round((spent / budget) * 100)) + '%"></span></div>' +
            (spent > budget ? '<p class="pt-warn">Over budget by ' + money(spent - budget) + "</p>" : '<p class="pt-muted">' + money(budget - spent) + " left to commit</p>")
          : '<p class="pt-muted">Add a budget on the <a href="#project">project screen</a> to track spending.</p>')
      ) +
      card(
        "Quick actions",
        '<div class="pt-quick">' +
        '<a href="#documents" class="pt-btn">📷 Add a document</a>' +
        '<a href="#inspections" class="pt-btn">🔍 Inspections</a>' +
        '<a href="#neighbours" class="pt-btn">✉ Notify neighbours</a>' +
        '<a href="#trades" class="pt-btn">👷 Trades</a>' +
        "</div>"
      ) +
      "</div>"
    );
  };

  VIEWS.compliance = function () {
    var groups = ["Approvals", "Insurance", "Tickets"];
    var html = groups.map(function (g) {
      var rows = state.compliance.filter(function (c) {
        return c.group === g;
      });
      if (!rows.length) return "";
      return card(
        g,
        '<ul class="pt-rows">' +
        rows.map(function (c) {
          var st = compStatus(c);
          var editing = ui.editing === c.id;
          return (
            '<li data-comp="' + esc(c.id) + '">' +
            '<div class="pt-row-main"><strong>' + esc(c.name) + "</strong>" +
            '<small class="pt-muted">' + esc(c.ref || (c.missing ? "Not added yet" : "")) + (c.note ? " · " + esc(c.note) : "") + "</small></div>" +
            pill(st.kind, st.text) +
            '<div class="pt-row-actions">' +
            (c.missing ? '<button type="button" class="pt-btn" data-action="comp-edit" data-id="' + esc(c.id) + '">Add details</button>' : '<button type="button" class="pt-btn" data-action="comp-edit" data-id="' + esc(c.id) + '">Update</button>') +
            '<button type="button" class="pt-linkbtn" data-action="comp-remove" data-id="' + esc(c.id) + '" aria-label="Remove ' + esc(c.name) + '">Remove</button>' +
            "</div>" +
            (editing
              ? '<form class="pt-inline" data-form="comp-update" data-id="' + esc(c.id) + '">' +
                '<label>Reference <input name="ref" value="' + esc(c.ref) + '"></label>' +
                '<label>Expiry date <input name="expires" type="date" value="' + esc(c.expires || "") + '"></label>' +
                '<span class="pt-muted pt-small">Leave the date empty if it doesn\'t expire.</span>' +
                '<button type="submit" class="pt-btn primary">Save</button><button type="button" class="pt-linkbtn" data-action="comp-cancel">Cancel</button>' +
                "</form>"
              : "") +
            "</li>"
          );
        }).join("") +
        "</ul>"
      );
    }).join("");
    var score = complianceScore();
    return (
      pageHead("Compliance", score.ok + " of " + score.total + " items current. You get a reminder 30 days before anything expires.") +
      html +
      card(
        "Add an item",
        '<form class="pt-form pt-form-row" data-form="comp-add">' +
        '<label>Name <input name="name" required placeholder="e.g. Scaffolding hire insurance"></label>' +
        '<label>Type <select name="group"><option>Approvals</option><option>Insurance</option><option>Tickets</option></select></label>' +
        '<label>Reference <input name="ref" placeholder="Number or policy"></label>' +
        '<label>Expiry date <input name="expires" type="date"></label>' +
        '<button type="submit" class="btn btn-primary">Add</button>' +
        "</form>"
      )
    );
  };

  VIEWS.inspections = function () {
    var next = nextInspection();
    var list =
      '<ol class="mock-stagelist pt-stagelist">' +
      state.inspections.map(function (i) {
        var cls = i.status === "passed" ? "passed" : i.status === "defects" ? "defect" : i === next ? "current" : "";
        var text =
          i.status === "passed" ? "Passed " + fmt(i.date) :
          i.status === "booked" ? "Booked " + fmtDay(i.date.slice(0, 10)) + " " + i.date.slice(11) :
          i.status === "defects" ? "Re-inspection needed" :
          i === next ? "Next up" : "Later";
        return '<li class="' + cls + '"><strong>' + esc(i.name) + "</strong><span>" + esc(text) + "</span></li>";
      }).join("") +
      "</ol>";
    var detail;
    if (!next) {
      detail = '<p class="pt-empty">All inspections passed. Time for handover: collect your certificates on the <a href="#documents">documents screen</a>.</p>';
    } else if (next.status === "booked") {
      detail =
        "<h3>" + esc(next.name) + " inspection: booked</h3>" +
        '<p><strong data-booked>' + esc(fmtDay(next.date.slice(0, 10)) + " " + next.date.slice(11)) + "</strong> with " + esc(state.project.surveyor || "your building surveyor") + ".</p>" +
        '<ul class="pt-checks done"><li>✓ Calendar invite sent to you</li><li>✓ Trades asked not to cover the work until it passes</li><li>✓ Plans and certificates shared with your surveyor</li></ul>' +
        '<p class="pt-label">After the visit, record the result</p>' +
        '<div class="pt-actions"><button type="button" class="btn btn-primary" data-action="insp-pass" data-id="' + next.id + '">Passed</button>' +
        '<button type="button" class="btn btn-outline" data-action="insp-defects" data-id="' + next.id + '">Defects noted</button>' +
        '<button type="button" class="pt-linkbtn" data-action="insp-cancel" data-id="' + next.id + '">Cancel booking</button></div>';
    } else if (next.status === "defects") {
      detail =
        "<h3>" + esc(next.name) + ": defects to fix</h3>" +
        '<ul class="pt-checks">' + (next.defects || []).map(function (d) { return "<li>⚠ " + esc(d) + "</li>"; }).join("") + "</ul>" +
        '<p class="pt-muted">Sent to the trade with the surveyor\'s notes. Any payment linked to this stage stays on hold.</p>' +
        '<button type="button" class="btn btn-primary" data-action="insp-fixed" data-id="' + next.id + '">Defects fixed: book a re-inspection</button>';
    } else {
      var ready = checklistDone(next);
      detail =
        "<h3>" + esc(next.name) + " inspection: are you ready?</h3>" +
        '<p class="pt-muted">Being ready saves a wasted visit and a re-inspection fee.</p>' +
        '<ul class="pt-checks">' +
        next.checklist.map(function (c, idx) {
          var isUpload = /uploaded$/i.test(c.text) && !c.done;
          return (
            '<li><label><input type="checkbox" data-action="insp-check" data-id="' + next.id + '" data-idx="' + idx + '"' + (c.done ? " checked" : "") + "> " + esc(c.text) + "</label>" +
            (isUpload ? ' <button type="button" class="pt-btn" data-action="insp-upload" data-id="' + next.id + '" data-idx="' + idx + '">Upload</button>' : "") +
            "</li>"
          );
        }).join("") +
        "</ul>" +
        (ready
          ? '<p class="pt-label">Pick a time with your building surveyor</p><div class="pt-slots">' +
            state.slots.map(function (s) {
              return '<button type="button" class="pt-slot" data-action="insp-book" data-id="' + next.id + '" data-slot="' + esc(s) + '">' + esc(fmtDay(s.slice(0, 10)) + " " + s.slice(11)) + "</button>";
            }).join("") +
            "</div>"
          : '<p class="pt-warn" data-not-ready>Tick everything above before booking.</p>');
    }
    return (
      pageHead("Inspections", "The stages on your building permit. Never cover up work until its inspection has passed.") +
      '<div class="pt-grid pt-grid-2">' + card("Your permit's inspections", list) + card("Next inspection", detail) + "</div>"
    );
  };

  function tradesRegister() {
    var rows = state.trades.map(function (t) {
      var ins = tradeInsurance(t);
      var cert = t.cert === "none" ? '<span class="pt-muted">Not needed</span>' : t.cert === "received" ? pill("green", "Received") : pill("amber", "Due at the end") + ' <button type="button" class="pt-linkbtn" data-action="trade-cert" data-id="' + t.id + '">Mark received</button>';
      var canStart = ins.rank > 0 && t.workcover;
      return (
        "<tr><td><strong>" + esc(t.trade) + "</strong></td><td>" + esc(t.business) + (t.tb ? ' <span class="tb-badge" title="Shares live status from Tradies Bureau">TB ✓</span>' : "") + "</td>" +
        "<td>" + pill("green", t.licence) + "</td><td>" + pill(ins.kind, ins.rank === 0 && !t.insurance ? "Not provided" : ins.text) +
        (ins.rank < 2 ? ' <button type="button" class="pt-linkbtn" data-action="trade-request" data-id="' + t.id + '">Request</button>' : "") + "</td>" +
        "<td>" + (t.workcover ? pill("green", "Current") : pill("red", "Missing")) + "</td><td>" + cert + "</td>" +
        "<td>" + (canStart ? pill("green", "Can start") : pill("red", "Can't start yet")) + "</td></tr>"
      );
    }).join("");
    return (
      card(
        "Trades register",
        (state.trades.length
          ? '<div class="table-wrap" tabindex="0" role="region" aria-label="Trades register"><table class="register pt-table"><thead><tr><th>Trade</th><th>Business</th><th>Licence</th><th>Public liability</th><th>WorkCover</th><th>End-of-job certificate</th><th>Status</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
          : '<p class="pt-empty">No trades yet. Add your first one below.</p>') +
        '<p class="pt-muted pt-small"><span class="tb-badge">TB ✓</span> shares live compliance status from Tradies Bureau.</p>'
      ) +
      card(
        "Add a trade",
        '<form class="pt-form pt-form-row" data-form="trade-add">' +
        '<label>Trade <input name="trade" required placeholder="e.g. Tiling"></label>' +
        '<label>Business <input name="business" required></label>' +
        '<label>Licence <select name="licence"><option>Registered</option><option>Licensed</option><option>Not required</option></select></label>' +
        '<label>Insurance expiry <input name="insurance" type="date"></label>' +
        '<label class="pt-check"><input type="checkbox" name="workcover" checked> WorkCover current</label>' +
        '<button type="submit" class="btn btn-primary">Add trade</button>' +
        "</form>"
      )
    );
  }

  function tradesTender() {
    var t = state.tender;
    if (!t.quotes.length) return card("Tender", '<p class="pt-empty">No quotes in yet for ' + esc(t.name.toLowerCase()) + ".</p>");
    var cheapest = Math.min.apply(null, t.quotes.map(function (q) { return q.price; }));
    return card(
      esc(t.name) + ": " + t.quotes.length + " quotes",
      '<p class="pt-muted">Same plans and scope sent to every trade. Closes ' + fmt(t.closes) + ".</p>" +
      '<div class="pt-quotes">' +
      t.quotes.map(function (q) {
        var awarded = t.awarded === q.id;
        var passed = t.awarded && !awarded;
        var comp = q.compliance === "ok" ? pill("green", "All current") : q.compliance === "warn" ? pill("amber", "Insurance renews soon") : pill("red", "No insurance on file");
        return (
          '<div class="pt-quote' + (awarded ? " awarded" : "") + (passed ? " passed" : "") + '">' +
          (q.price === cheapest ? '<span class="pt-flag">Cheapest</span>' : "") +
          "<strong>" + esc(q.business) + (q.tb ? ' <span class="tb-badge">TB ✓</span>' : "") + "</strong>" +
          '<div class="pt-price">' + money(q.price) + "</div>" +
          "<dl><dt>Includes</dt><dd>" + esc(q.includes) + "</dd><dt>Excludes</dt><dd>" + esc(q.excludes) + "</dd><dt>Start</dt><dd>" + (q.start ? fmt(q.start) : "Not stated") + "</dd><dt>Compliance</dt><dd>" + comp + "</dd></dl>" +
          (t.awarded
            ? awarded ? '<span class="pill pill-green">Awarded ✓</span>' : ""
            : '<button type="button" class="btn btn-primary pt-btn-sm" data-action="award" data-id="' + q.id + '">Award</button>') +
          "</div>"
        );
      }).join("") +
      "</div>" +
      '<p class="pt-tip"><strong>Top tip:</strong> the cheapest quote is often the one that left something out. Read the "excludes" line twice.</p>'
    );
  }

  function tradesContracts() {
    if (!state.contracts.length) return card("Contracts", '<p class="pt-empty">No contracts yet. Award a quote to start one.</p>');
    return state.contracts.map(function (k) {
      var tot = contractTotals(k);
      var pct = Math.round((tot.paid / tot.revised) * 100);
      var pays = k.payments.map(function (p, idx) {
        var right =
          p.status === "paid" ? pill("green", "Paid " + money(p.amount)) :
          p.status === "due" ? '<button type="button" class="pt-btn primary" data-action="pay" data-id="' + k.id + '" data-idx="' + idx + '">Approve payment ' + money(p.amount) + "</button>" :
          p.status === "waiting" ? pill("amber", "Waits for inspection") :
          '<span class="pt-muted">' + money(p.amount) + "</span>";
        return "<li><span>" + esc(p.name) + "</span>" + right + "</li>";
      }).join("");
      var vars = k.variations.length
        ? k.variations.map(function (v) {
            var right =
              v.status === "approved" ? pill("green", "+" + money(v.amount)) :
              v.status === "queried" ? pill("grey", "Queried") :
              '<span class="pt-actions-inline"><button type="button" class="pt-btn primary" data-action="var-approve" data-id="' + k.id + '" data-var="' + v.id + '">Approve +' + money(v.amount) + '</button><button type="button" class="pt-linkbtn" data-action="var-query" data-id="' + k.id + '" data-var="' + v.id + '">Query</button></span>';
            var sub = v.status === "approved" ? "Approved in writing " + v.when : v.status === "queried" ? "Query sent " + v.when + ". Don't start this work until it's approved." : "Requested " + v.when;
            return '<li><span>' + esc(v.text) + '<br><small class="pt-muted">' + esc(sub) + "</small></span>" + right + "</li>";
          }).join("")
        : '<li><span class="pt-muted">No variations.</span></li>';
      return card(
        esc(k.business) + ' <span class="pt-muted pt-small">' + esc(k.trade) + "</span>",
        '<div class="pt-money"><div><span>Contract</span><strong>' + money(k.sum) + '</strong></div><div><span>Variations</span><strong>+' + money(tot.variations) + '</strong></div><div><span>Revised</span><strong data-revised="' + k.id + '">' + money(tot.revised) + '</strong></div><div><span>Paid</span><strong>' + money(tot.paid) + "</strong></div></div>" +
        '<div class="pt-bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="pt-grid pt-grid-2 pt-tight"><div><h3>Payments</h3><ul class="pt-list">' + pays + '</ul></div><div><h3>Variations</h3><ul class="pt-list">' + vars + "</ul>" +
        '<form class="pt-form pt-form-row pt-small-form" data-form="var-add" data-id="' + k.id + '"><label>Change requested <input name="text" required placeholder="What and why"></label><label>Cost <input name="amount" type="number" min="0" step="10" required></label><button type="submit" class="pt-btn">Log variation</button></form>' +
        "</div></div>"
      );
    }).join("");
  }

  VIEWS.trades = function () {
    var tabs = [["register", "Register"], ["tender", "Quotes"], ["contracts", "Contracts"]];
    var body = ui.tradesTab === "tender" ? tradesTender() : ui.tradesTab === "contracts" ? tradesContracts() : tradesRegister();
    return (
      pageHead("Trades & contracts", "Without a builder, every trade is your own contract. Check them, compare them, and keep the paper trail.") +
      '<div class="pt-tabs" role="tablist">' +
      tabs.map(function (t) {
        var on = ui.tradesTab === t[0];
        return '<button type="button" role="tab" aria-selected="' + on + '" class="pt-tab' + (on ? " on" : "") + '" data-action="tab" data-tab="' + t[0] + '">' + t[1] + "</button>";
      }).join("") +
      "</div>" +
      body
    );
  };

  var UPDATE_TYPES = {
    Trucks: "Concrete trucks and a pump on the street",
    Noise: "Noisy work: cutting and machinery",
    Crane: "Crane truck on the street for about 2 hours",
    "Footpath closed": "Footpath closed out the front",
    Machinery: "Excavator and machinery on site"
  };

  var DROP_LOTS = {
    left: ["7", "9", "11", "13", "15", "17"],
    right: ["8", "10", "14", "16", "18"],
    rear: ["1", "3", "5"]
  };
  var DROP_AREAS = {
    next: ["s10", "s14", "s11", "s13", "b3"],
    block: ["s7", "s9", "s11", "s13", "s15", "s8", "s10", "s14", "s16", "b1", "b3", "b5"],
    wide: ["s7", "s9", "s11", "s13", "s15", "s17", "s8", "s10", "s14", "s16", "s18", "b1", "b3", "b5"]
  };

  VIEWS.neighbours = function () {
    var n = state.neighbours;
    var subs = n.subscribers.length;
    var msg = UPDATE_TYPES[ui.composeType];
    var area = DROP_AREAS[n.dropArea];
    var dropped = area.filter(function (id) { return n.dropped[id]; }).length;
    function lotBtn(id, label) {
      var inArea = area.indexOf(id) !== -1;
      var done = !!n.dropped[id];
      return '<button type="button" class="pt-lot' + (inArea ? (done ? " done" : " todo") : " out") + '" data-action="drop-toggle" data-lot="' + id + '" aria-pressed="' + (inArea && done) + '"' + (inArea ? "" : ' disabled title="Not in this drop"') + ">" + esc(label) + (done && inArea ? " ✓" : "") + "</button>";
    }
    var compose = card(
      "Send an update",
      '<form class="pt-form" data-form="send-update">' +
      '<p class="pt-label">What\'s happening?</p><div class="pt-chips">' +
      Object.keys(UPDATE_TYPES).map(function (t) {
        return '<button type="button" class="pt-chip' + (ui.composeType === t ? " on" : "") + '" aria-pressed="' + (ui.composeType === t) + '" data-action="compose-type" data-type="' + esc(t) + '">' + esc(t) + "</button>";
      }).join("") +
      "</div>" +
      '<div class="pt-form-row"><label>Date <input type="date" name="date" required value="' + days(3) + '" min="' + days(0) + '"></label><label>From <input name="time" value="7:00am" required></label></div>' +
      '<label>Extra note (optional) <input name="note" placeholder="e.g. Please avoid parking out the front"></label>' +
      '<div class="pt-preview"><span class="pt-label">Preview</span><p data-preview>Heads up from ' + esc(state.project.address) + ": " + esc(msg) + ". – " + esc(state.project.owner) + "</p></div>" +
      '<button type="submit" class="btn btn-primary">Send to ' + subs + " subscriber" + (subs === 1 ? "" : "s") + "</button>" +
      '<p class="pt-muted pt-small">Neighbours who aren\'t signed up get a printed copy in the letterbox.</p>' +
      "</form>"
    );
    var log = card(
      "Sent so far",
      n.updates.length
        ? '<ul class="pt-list" data-update-log>' +
          n.updates.slice().reverse().map(function (u) {
            return "<li><span><strong>" + esc(u.type) + "</strong> · " + esc(u.note) + '<br><small class="pt-muted">' + fmt(u.when) + "</small></span>" + pill("green", u.reached + " reached") + "</li>";
          }).join("") +
          "</ul>"
        : '<p class="pt-empty">Nothing sent yet.</p>'
    );
    var subsCard = card(
      "Signed up (" + subs + ")",
      (subs ? '<ul class="pt-list">' + n.subscribers.map(function (s) { return "<li><span>" + esc(s.addr) + "</span>" + pill("grey", s.channel) + "</li>"; }).join("") + "</ul>" : '<p class="pt-empty">No one yet. They sign up by scanning the QR code on your notice.</p>') +
      '<form class="pt-form pt-form-row pt-small-form" data-form="add-sub"><label>Address <input name="addr" required placeholder="e.g. 9 Smith St"></label><label>By <select name="channel"><option>SMS</option><option>Email</option></select></label><button type="submit" class="pt-btn">Add (as if they scanned)</button></form>'
    );
    var drop = card(
      "Letterbox drop",
      '<div class="pt-chips">' +
      [["next", "Next door & opposite"], ["block", "The whole block"], ["wide", "Wider (crane or road closure)"]].map(function (a) {
        return '<button type="button" class="pt-chip' + (n.dropArea === a[0] ? " on" : "") + '" aria-pressed="' + (n.dropArea === a[0]) + '" data-action="drop-area" data-area="' + a[0] + '">' + a[1] + "</button>";
      }).join("") +
      "</div>" +
      '<p><strong data-drop-count>' + dropped + " of " + area.length + "</strong> dropped. Tap each house as you go.</p>" +
      '<div class="pt-street"><div class="pt-side-col"><span class="pt-label">Smith St (odd)</span>' + DROP_LOTS.left.map(function (x) { return lotBtn("s" + x, x + " Smith St"); }).join("") + "</div>" +
      '<div class="pt-side-col"><span class="pt-label">Smith St (even)</span>' + DROP_LOTS.right.slice(0, 1).map(function (x) { return lotBtn("s" + x, x + " Smith St"); }).join("") + lotBtn("s10", "10 Smith St") + '<span class="pt-lot you">12 · you</span>' + DROP_LOTS.right.slice(2).map(function (x) { return lotBtn("s" + x, x + " Smith St"); }).join("") + "</div>" +
      '<div class="pt-side-col"><span class="pt-label">Back Lane</span>' + DROP_LOTS.rear.map(function (x) { return lotBtn("b" + x, x + " Back Ln"); }).join("") + "</div></div>" +
      '<div class="pt-actions"><button type="button" class="btn btn-primary" data-action="drop-log">Log this drop</button><a class="btn btn-outline" href="' + SITE + 'demo/notice.html" target="_blank" rel="noopener">See the printable notice</a></div>'
    );
    return (
      pageHead("Neighbours", "Tell the street before the noisy days. Every send is logged as proof you gave notice.") +
      '<div class="pt-grid pt-grid-2">' + compose + drop + log + subsCard + "</div>"
    );
  };

  var ASSET_STEPS = ["Permit & bond paid", "Before photos", "Works", "After photos", "Final inspection", "Bond refunded"];

  VIEWS.asset = function () {
    var a = state.asset;
    var missing = a.photos.filter(function (p) { return !p.taken; }).length;
    var photos = a.photos.map(function (p) {
      return (
        '<div class="pt-photo' + (p.taken ? " ok" : "") + '"><strong>' + esc(p.label) + "</strong>" +
        (p.taken ? '<small class="pt-ok">✓ ' + esc(p.taken) + "</small>" : '<button type="button" class="pt-btn" data-action="photo" data-key="' + p.key + '">📷 Take photo</button>') +
        "</div>"
      );
    }).join("");
    var track = '<ol class="pt-track">' + ASSET_STEPS.map(function (s, i) {
      return '<li class="' + (i < a.stage ? "done" : i === a.stage ? "now" : "") + '">' + esc(s) + "</li>";
    }).join("") + "</ol>";
    var canNext = a.stage < ASSET_STEPS.length - 1 && !(a.stage === 1 && missing);
    var nextLabel = a.stage === 0 ? "Bond paid" : a.stage === 1 ? "Photos done, works can start" : a.stage === 2 ? "Works finished" : a.stage === 3 ? "After photos taken" : a.stage === 4 ? "Bond refunded" : "";
    return (
      pageHead("Asset protection", "Dated before photos of the footpath, kerb and nature strip are what get your bond back.") +
      card(
        "Permit " + esc(a.permit) + " · Bond " + money(a.bond),
        track +
        (a.stage < ASSET_STEPS.length - 1
          ? '<div class="pt-actions"><button type="button" class="btn btn-primary" data-action="asset-next"' + (canNext ? "" : " disabled") + ">Next: " + esc(nextLabel) + "</button>" +
            (a.stage === 1 && missing ? '<span class="pt-warn">Take the last ' + missing + " photo" + (missing === 1 ? "" : "s") + " first.</span>" : "") + "</div>"
          : '<p class="pt-ok" data-bond-done><strong>Bond refunded. All done.</strong></p>')
      ) +
      card("Before photos (" + (a.photos.length - missing) + " of " + a.photos.length + ")", '<p class="pt-muted pt-small">Photos are dated automatically and can\'t be edited later.</p><div class="pt-photos">' + photos + "</div>")
    );
  };

  VIEWS.dilapidation = function () {
    var rows = state.dilapidation.map(function (d) {
      var status = d.pre ? pill("green", "Report on file") : d.refused ? pill("amber", "Access declined") : pill("red", "Needed before works");
      return (
        "<tr><td><strong>" + esc(d.addr) + "</strong>" + (d.adjoining ? "" : ' <span class="pt-muted pt-small">(not adjoining)</span>') + "</td>" +
        "<td>" + (d.pre ? esc(d.pre) + (d.by ? " · " + esc(d.by) : "") : '<button type="button" class="pt-btn" data-action="dilap-upload" data-id="' + d.id + '">Upload report</button>') + "</td>" +
        '<td><label class="pt-check"><input type="checkbox" data-action="dilap-copy" data-id="' + d.id + '"' + (d.copy ? " checked" : "") + (d.pre ? "" : " disabled") + "> Copy given</label></td>" +
        '<td><label class="pt-check"><input type="checkbox" data-action="dilap-refused" data-id="' + d.id + '"' + (d.refused ? " checked" : "") + "> Access declined</label></td>" +
        "<td>" + (d.post ? pill("green", "Done") : '<button type="button" class="pt-linkbtn" data-action="dilap-post" data-id="' + d.id + '">Add after-works report</button>') + "</td>" +
        "<td>" + status + "</td></tr>"
      );
    }).join("");
    return (
      pageHead("Dilapidation", "Record each neighbouring property's condition before works start, and give the neighbour a copy.") +
      card(
        "Neighbouring properties",
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Dilapidation register"><table class="register pt-table"><thead><tr><th>Property</th><th>Before-works report</th><th>Copy</th><th>Access</th><th>After works</th><th>Status</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
        '<p class="pt-muted pt-small">If a neighbour declines access, ticking "Access declined" keeps a dated note on file.</p>'
      ) +
      card(
        "Add a property",
        '<form class="pt-form pt-form-row" data-form="dilap-add"><label>Address <input name="addr" required placeholder="e.g. 16 Smith St"></label><label class="pt-check"><input type="checkbox" name="adjoining" checked> Adjoining</label><button type="submit" class="btn btn-primary">Add</button></form>'
      )
    );
  };

  VIEWS.documents = function () {
    var h = handover();
    var q = ui.docQuery.toLowerCase();
    var shown = state.documents.filter(function (d) {
      return (ui.docFolder === "All" || d.folder === ui.docFolder) && (!q || d.name.toLowerCase().indexOf(q) !== -1);
    });
    var folders = ["All"].concat(FOLDERS).map(function (f) {
      var count = f === "All" ? state.documents.length : state.documents.filter(function (d) { return d.folder === f; }).length;
      return '<button type="button" class="pt-folder' + (ui.docFolder === f ? " on" : "") + '" aria-pressed="' + (ui.docFolder === f) + '" data-action="folder" data-folder="' + esc(f) + '">' + esc(f === "All" ? "All documents" : f) + " <em>" + count + "</em></button>";
    }).join("");
    return (
      pageHead("Documents", "Everything for handover, a sale or a dispute, filed and dated.") +
      '<div class="pt-docs-layout"><div class="pt-folders">' + folders + "</div><div>" +
      card(
        "Handover pack",
        '<div class="pt-score"><strong data-handover>' + h.ready + " of " + h.total + "</strong><span>documents ready</span></div>" +
        '<div class="pt-bar"><span style="width:' + h.pct + '%"></span></div>' +
        (h.missing.length ? '<p class="pt-muted">Still to collect: ' + h.missing.map(esc).join(", ") + "</p>" : '<p class="pt-ok"><strong>Everything collected.</strong></p>') +
        '<button type="button" class="pt-btn" data-action="export">Download build file</button>'
      ) +
      card(
        "Add a document",
        '<form class="pt-form pt-form-row" data-form="doc-add"><label>Name <input name="name" required list="pt-needed" placeholder="What is it?"></label>' +
        '<datalist id="pt-needed">' + h.missing.map(function (m) { return '<option value="' + esc(m) + '">'; }).join("") + "</datalist>" +
        '<label>Folder <select name="folder">' + FOLDERS.map(function (f) { return "<option" + (ui.docFolder === f ? " selected" : "") + ">" + esc(f) + "</option>"; }).join("") + "</select></label>" +
        '<label class="pt-check"><input type="checkbox" name="handover" checked> Keep for handover</label>' +
        '<button type="submit" class="btn btn-primary">📷 Add</button></form>' +
        '<p class="pt-muted pt-small">In the app you\'d snap a photo or forward an email. Pick a name from the suggestions to tick off a handover document.</p>'
      ) +
      card(
        esc(ui.docFolder === "All" ? "All documents" : ui.docFolder) + " (" + shown.length + ")",
        '<label class="pt-search"><span class="pt-sr">Search documents</span><input type="search" data-input="doc-search" placeholder="Search documents" value="' + esc(ui.docQuery) + '"></label>' +
        (shown.length
          ? '<ul class="pt-list" data-doc-list>' +
            shown.map(function (d) {
              return "<li><span><strong>" + esc(d.name) + '</strong><br><small class="pt-muted">' + esc(d.folder) + " · " + fmt(d.date) + "</small></span>" + (d.superseded ? pill("grey", "Superseded") : d.handover ? pill("green", "For handover") : pill("grey", "On file")) + "</li>";
            }).join("") +
            "</ul>"
          : '<p class="pt-empty" data-docs-empty>Nothing matches.</p>')
      ) +
      "</div></div>"
    );
  };

  VIEWS.project = function () {
    var p = state.project;
    function field(name, label, type) {
      return '<label>' + label + ' <input name="' + name + '" type="' + (type || "text") + '" value="' + esc(p[name]) + '"></label>';
    }
    var share = ui.shareLink
      ? '<div class="pt-share-link"><p><strong>Read-only link created</strong> for ' + esc(ui.shareLink.who) + ", expires " + fmt(ui.shareLink.expires) + ".</p>" +
        '<code data-share-url>' + esc(ui.shareLink.url) + "</code>" +
        '<p class="pt-muted pt-small">Demo link: in the app this opens the surveyor\'s view. <a href="' + SITE + 'demo/app.html#surveyor" target="_blank" rel="noopener">See what they\'d see</a>.</p>' +
        '<button type="button" class="pt-btn" data-action="share-off">Turn off link</button></div>'
      : '<form class="pt-form" data-form="share"><label>Share with <input name="who" required value="' + esc(p.surveyor || "") + '" placeholder="e.g. your building surveyor"></label>' +
        '<fieldset class="pt-fieldset"><legend>Folders</legend>' +
        FOLDERS.map(function (f) {
          var on = ["Approvals & permits", "Inspections", "Plans & engineering"].indexOf(f) !== -1;
          return '<label class="pt-check"><input type="checkbox" name="folders" value="' + esc(f) + '"' + (on ? " checked" : "") + "> " + esc(f) + "</label>";
        }).join("") +
        "</fieldset><button type=\"submit\" class=\"btn btn-primary\">Create read-only link</button></form>";
    return (
      pageHead("Project & sharing", "Your project details, sharing, and your data.") +
      '<div class="pt-grid pt-grid-2">' +
      card(
        "Project details",
        '<form class="pt-form" data-form="project">' +
        field("address", "Street address") + field("suburb", "Suburb and state") + field("council", "Council") + field("work", "Work") +
        field("owner", "Owner builder") + field("phone", "Phone", "tel") + field("surveyor", "Building surveyor") + field("permit", "Building permit number") + field("budget", "Budget", "number") +
        '<button type="submit" class="btn btn-primary">Save details</button></form>'
      ) +
      card("Share with your surveyor", share) +
      card(
        "Your data",
        '<p>Your records belong to you. Download everything any time.</p><div class="pt-actions"><button type="button" class="pt-btn" data-action="export">Download build file (JSON)</button>' +
        '<button type="button" class="pt-btn danger" data-action="reset-demo">Reset demo</button></div>' +
        '<p class="pt-muted pt-small">Reset puts the sample project back. Your review notes are kept.</p>'
      ) +
      "</div>"
    );
  };

  // ---------- rendering ----------

  var app = document.getElementById("app");
  var toastTimer = null;

  function toast(msg) {
    var el = document.querySelector("[data-toast]");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.hidden = true;
    }, 6000);
  }

  var FOCUS_ATTRS = ["data-action", "data-form", "data-id", "data-idx", "data-lot", "data-key", "data-area", "data-type", "data-tab", "data-folder", "data-input", "data-var", "data-slot"];

  function focusKey(el) {
    if (!el || el === document.body) return null;
    if (el.id) return "#" + CSS.escape(el.id);
    var parts = FOCUS_ATTRS.filter(function (a) {
      return el.hasAttribute(a);
    }).map(function (a) {
      return "[" + a + '="' + CSS.escape(el.getAttribute(a)) + '"]';
    });
    return parts.length ? el.tagName.toLowerCase() + parts.join("") : null;
  }

  function render(focusHeading) {
    var active = document.activeElement;
    var key = app.contains(active) ? focusKey(active) : null;
    var caret = active && typeof active.selectionStart === "number" ? active.selectionStart : null;

    if (!state.started) {
      app.innerHTML = renderLogin();
      document.title = "Sign in — OBIABOX demo portal";
    } else {
      var view = VIEWS[ui.route] || VIEWS.dashboard;
      app.innerHTML = renderShell(view());
      var r = ROUTES.filter(function (x) { return x.id === ui.route; })[0];
      document.title = (r ? r.label : "Dashboard") + " — OBIABOX demo portal";
      var house = app.querySelector("[data-house-progress]");
      if (house && window.OBIABHouse) window.OBIABHouse.draw(house, parseFloat(house.getAttribute("data-house-progress")));
    }

    if (focusHeading) {
      var h = app.querySelector("h1");
      if (h) h.focus({ preventScroll: false });
      return;
    }
    if (key) {
      var again = app.querySelector(key);
      if (again) {
        again.focus({ preventScroll: true });
        if (caret !== null && typeof again.setSelectionRange === "function") {
          try {
            again.setSelectionRange(caret, caret);
          } catch (e) {
            /* not a text field */
          }
        }
      }
    }
  }

  function commit(msg) {
    save();
    render();
    if (msg) toast(msg);
  }

  function routeFromHash() {
    var id = (window.location.hash || "").replace(/^#\/?/, "");
    return VIEWS[id] ? id : "dashboard";
  }

  // ---------- actions ----------

  function findBy(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function addDoc(name, folder, handover) {
    state.documents.push({ id: uid("f"), name: name, folder: folder, date: days(0), handover: handover !== false });
    var lower = name.toLowerCase();
    state.handoverNeeded = state.handoverNeeded.filter(function (n) {
      return n.toLowerCase() !== lower;
    });
  }

  function download(filename, text, type) {
    if (window.claude && typeof window.claude.use === "function") {
      window.claude.use("downloads").then(function (dl) {
        if (!dl) {
          toast("Downloads aren't available here. Use Copy instead.");
          return;
        }
        dl.save({ filename: filename, data: text }).then(
          function (r) {
            if (r && r.status === "saved") toast("Saved " + filename + ".");
          },
          function (e) {
            if (e && e.code === "unavailable") toast("Downloads aren't available here. Use Copy instead.");
          }
        );
      });
      return;
    }
    var blob = new Blob([text], { type: type });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  function notesText() {
    var lines = ["OBIABOX demo portal: review notes", "Exported " + nowStamp(), ""];
    state.notes.forEach(function (n, i) {
      lines.push(i + 1 + ". [" + n.screen + "] " + n.at);
      lines.push("   " + n.text.replace(/\n/g, "\n   "));
      lines.push("");
    });
    return lines.join("\n");
  }

  var DEFECTS = {
    Footings: ["Trench depth short at the north-east corner", "Reinforcement chairs missing along the rear footing"],
    "Slab (pre-pour)": ["Vapour barrier torn near the laundry", "Termite collars missing on two pipes"],
    Frame: ["Missing tie-down at the rear corner", "Undersized lintel over the laundry door"],
    Final: ["Smoke alarm in hallway not interconnected", "Balustrade gap too wide on the rear deck"]
  };

  var ACTIONS = {
    "show-setup": function () {
      ui.setup = true;
      render();
      var f = app.querySelector("#s-address");
      if (f) f.focus();
    },
    "toggle-nav": function () {
      ui.navOpen = !ui.navOpen;
      render();
    },
    "toggle-notes": function () {
      ui.notesOpen = !ui.notesOpen;
      render();
      var target = ui.notesOpen ? app.querySelector("#pt-note") : app.querySelector(".pt-notes-btn");
      if (target) target.focus();
    },
    "sign-out": function () {
      state.started = false;
      ui.notesOpen = false;
      save();
      render(true);
    },
    "reset-demo": function () {
      ui.confirmReset = true;
      render();
      var yes = app.querySelector('[data-action="reset-yes"]');
      if (yes) yes.focus();
    },
    "reset-no": function () {
      ui.confirmReset = false;
      render();
    },
    "reset-yes": function () {
      ui.confirmReset = false;
      var keepNotes = state.notes;
      var keepUser = state.user;
      var wasStarted = state.started;
      state = seed();
      state.notes = keepNotes;
      state.user = keepUser;
      state.started = wasStarted;
      ui.shareLink = null;
      ui.editing = null;
      ui.docFolder = "All";
      ui.docQuery = "";
      commit("Demo reset to the sample project.");
    },
    "delete-note": function (el) {
      state.notes = state.notes.filter(function (n) {
        return n.id !== el.getAttribute("data-id");
      });
      commit();
    },
    comment: function () {
      var h = app.querySelector("main h1");
      if (!h || !window.claude) return;
      window.claude.use("comments").then(function (c) {
        if (!c) {
          ui.commentsReady = false;
          render();
          return;
        }
        var range = document.createRange();
        range.selectNodeContents(h);
        c.openComposer({ range: range }).then(
          function (r) {
            if (r && r.opened) {
              ui.notesOpen = false;
              render();
            }
          },
          function (e) {
            if (e && e.code === "unavailable") {
              ui.commentsReady = false;
              render();
              toast("Comments aren't open to you on this page. Use private notes and copy them instead.");
            }
          }
        );
      });
    },
    "copy-notes": function () {
      var text = notesText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () {
            toast("Notes copied. Paste them into an email or document.");
          },
          function () {
            toast("Couldn't copy. Try Download instead.");
          }
        );
      } else {
        toast("Couldn't copy. Try Download instead.");
      }
    },
    "download-notes": function () {
      download("obiabox-review-notes.txt", notesText(), "text/plain");
      if (!window.claude) toast("Notes downloaded.");
    },
    "comp-edit": function (el) {
      ui.editing = el.getAttribute("data-id");
      render();
      var f = app.querySelector('[data-form="comp-update"] input');
      if (f) f.focus();
    },
    "comp-cancel": function () {
      ui.editing = null;
      render();
    },
    "comp-remove": function (el) {
      var c = findBy(state.compliance, el.getAttribute("data-id"));
      state.compliance = state.compliance.filter(function (x) {
        return x !== c;
      });
      commit(c ? "Removed " + c.name + "." : "");
    },
    "insp-check": function (el) {
      var i = findBy(state.inspections, el.getAttribute("data-id"));
      i.checklist[+el.getAttribute("data-idx")].done = el.checked;
      commit();
    },
    "insp-upload": function (el) {
      var i = findBy(state.inspections, el.getAttribute("data-id"));
      var item = i.checklist[+el.getAttribute("data-idx")];
      item.done = true;
      addDoc(item.text.replace(/\s+uploaded$/i, ""), "Inspections", true);
      commit("Uploaded and filed under Inspections.");
    },
    "insp-book": function (el) {
      var i = findBy(state.inspections, el.getAttribute("data-id"));
      i.status = "booked";
      i.date = el.getAttribute("data-slot");
      commit(i.name + " inspection booked for " + fmtDay(i.date.slice(0, 10)) + " " + i.date.slice(11) + ".");
    },
    "insp-cancel": function (el) {
      var i = findBy(state.inspections, el.getAttribute("data-id"));
      i.status = "ready";
      i.date = null;
      commit("Booking cancelled.");
    },
    "insp-pass": function (el) {
      var i = findBy(state.inspections, el.getAttribute("data-id"));
      i.status = "passed";
      i.date = days(0);
      i.defects = null;
      addDoc(i.name + " inspection: passed", "Inspections", true);
      if (i.name === "Final") addDoc("Final inspection certificate", "Inspections", true);
      var released = [];
      state.contracts.forEach(function (k) {
        k.payments.forEach(function (p) {
          if (p.inspection === i.id && p.status === "waiting") {
            p.status = "due";
            released.push(k.business + " " + money(p.amount));
          }
        });
      });
      var next = nextInspection();
      if (next && next.status === "todo") next.status = "ready";
      commit(i.name + " inspection passed." + (released.length ? " Payment ready to approve: " + released.join(", ") + "." : ""));
    },
    "insp-defects": function (el) {
      var i = findBy(state.inspections, el.getAttribute("data-id"));
      i.status = "defects";
      i.defects = DEFECTS[i.name] || ["Defect noted by the surveyor"];
      commit("Defects recorded and sent to the trade. The linked payment stays on hold.");
    },
    "insp-fixed": function (el) {
      var i = findBy(state.inspections, el.getAttribute("data-id"));
      i.status = "ready";
      i.date = null;
      commit("Marked fixed. Pick a time for the re-inspection.");
    },
    tab: function (el) {
      ui.tradesTab = el.getAttribute("data-tab");
      render();
    },
    "trade-cert": function (el) {
      var t = findBy(state.trades, el.getAttribute("data-id"));
      t.cert = "received";
      var name = t.trade === "Plumbing" ? "Plumbing compliance certificate" : t.trade === "Electrical" ? "Electrical safety certificate" : t.trade === "Waterproofing" ? "Waterproofing certificate" : t.trade + " compliance certificate";
      addDoc(name, "End-of-job certificates", true);
      commit(name + " filed for handover.");
    },
    "trade-request": function (el) {
      var t = findBy(state.trades, el.getAttribute("data-id"));
      toast("Demo: a request for current insurance was sent to " + t.business + ".");
    },
    award: function (el) {
      var q = findBy(state.tender.quotes, el.getAttribute("data-id"));
      state.tender.awarded = q.id;
      var ins = q.compliance === "ok" ? days(200) : q.compliance === "warn" ? days(14) : null;
      if (!state.trades.some(function (t) { return t.business === q.business; })) {
        state.trades.push({ id: uid("t"), trade: state.tender.name, business: q.business, licence: "Registered", insurance: ins, workcover: true, tb: q.tb, cert: "due" });
      }
      var dep = Math.round(q.price * 0.05);
      var mid = Math.round(q.price * 0.45);
      state.contracts.push({
        id: uid("k"),
        trade: state.tender.name,
        business: q.business,
        sum: q.price,
        payments: [
          { name: "Deposit", amount: dep, status: "later" },
          { name: "Work complete", amount: mid, status: "later" },
          { name: "Certificate received", amount: q.price - dep - mid, status: "later" }
        ],
        variations: []
      });
      addDoc("Accepted quote: " + q.business, "Trades & contracts", true);
      commit(
        "Awarded to " + q.business + ". A contract has been started" +
        (q.compliance === "bad" ? ", but they can't start until they give you proof of insurance." : ".")
      );
    },
    pay: function (el) {
      var k = findBy(state.contracts, el.getAttribute("data-id"));
      var p = k.payments[+el.getAttribute("data-idx")];
      p.status = "paid";
      commit("Payment of " + money(p.amount) + " to " + k.business + " recorded.");
    },
    "var-approve": function (el) {
      var k = findBy(state.contracts, el.getAttribute("data-id"));
      var v = findBy(k.variations, el.getAttribute("data-var"));
      v.status = "approved";
      v.when = fmt(days(0));
      commit("Variation approved in writing and saved to the contract.");
    },
    "var-query": function (el) {
      var k = findBy(state.contracts, el.getAttribute("data-id"));
      var v = findBy(k.variations, el.getAttribute("data-var"));
      v.status = "queried";
      v.when = fmt(days(0));
      commit("Query sent to " + k.business + ".");
    },
    "compose-type": function (el) {
      ui.composeType = el.getAttribute("data-type");
      render();
    },
    "drop-area": function (el) {
      state.neighbours.dropArea = el.getAttribute("data-area");
      commit();
    },
    "drop-toggle": function (el) {
      var id = el.getAttribute("data-lot");
      state.neighbours.dropped[id] = !state.neighbours.dropped[id];
      commit();
    },
    "drop-log": function () {
      var area = DROP_AREAS[state.neighbours.dropArea];
      var done = area.filter(function (id) { return state.neighbours.dropped[id]; }).length;
      state.neighbours.updates.push({ id: uid("u"), type: "Letterbox drop", when: days(0), note: "Notice dropped at " + done + " of " + area.length + " houses", reached: done });
      commit(done === area.length ? "Drop logged: " + done + " houses. Saved as proof you gave notice." : "Logged " + done + " of " + area.length + ". The rest are saved for next time.");
    },
    photo: function (el) {
      var key = el.getAttribute("data-key");
      state.asset.photos.forEach(function (p) {
        if (p.key === key) p.taken = nowStamp();
      });
      var left = state.asset.photos.filter(function (p) { return !p.taken; }).length;
      commit(left ? "Photo saved and dated. " + left + " to go." : "All before photos done. Works can start.");
    },
    "asset-next": function () {
      var a = state.asset;
      if (a.stage === 0 && !a.bondPaid) a.bondPaid = days(0);
      a.stage = Math.min(a.stage + 1, ASSET_STEPS.length - 1);
      commit(a.stage === ASSET_STEPS.length - 1 ? "Bond refunded. Nice." : "Moved to: " + ASSET_STEPS[a.stage] + ".");
    },
    "dilap-upload": function (el) {
      var d = findBy(state.dilapidation, el.getAttribute("data-id"));
      d.pre = fmt(days(0));
      d.by = "Uploaded by you";
      d.refused = false;
      addDoc("Dilapidation report: " + d.addr.replace(" (rear)", ""), "Neighbours & council", true);
      commit("Report filed. Remember to give " + d.addr + " a copy.");
    },
    "dilap-copy": function (el) {
      findBy(state.dilapidation, el.getAttribute("data-id")).copy = el.checked;
      commit();
    },
    "dilap-refused": function (el) {
      findBy(state.dilapidation, el.getAttribute("data-id")).refused = el.checked;
      commit(el.checked ? "Dated note saved: access declined." : "");
    },
    "dilap-post": function (el) {
      var d = findBy(state.dilapidation, el.getAttribute("data-id"));
      d.post = true;
      addDoc("After-works dilapidation report: " + d.addr, "Neighbours & council", true);
      commit("After-works report filed.");
    },
    folder: function (el) {
      ui.docFolder = el.getAttribute("data-folder");
      render();
    },
    export: function () {
      var copy = JSON.parse(JSON.stringify(state));
      delete copy.notes;
      download("obiabox-build-file.json", JSON.stringify(copy, null, 2), "application/json");
      if (!window.claude) toast("Build file downloaded. In the app this is a zip of every document with an index.");
    },
    "share-off": function () {
      ui.shareLink = null;
      render();
      toast("Link turned off. It no longer works.");
    }
  };

  function values(form) {
    var out = {};
    new FormData(form).forEach(function (v, k) {
      if (out[k] !== undefined) out[k] = [].concat(out[k], v);
      else out[k] = typeof v === "string" ? v.trim() : v;
    });
    return out;
  }

  var FORMS = {
    signin: function (v) {
      state.user = v.email || "";
      state.started = true;
      ui.route = "dashboard";
      if (window.location.hash !== "#dashboard") window.location.hash = "#dashboard";
      save();
      render(true);
    },
    setup: function (v) {
      var keepNotes = state.notes;
      state = blankProject(v);
      state.notes = keepNotes;
      state.started = true;
      ui.setup = false;
      ui.route = "dashboard";
      if (window.location.hash !== "#dashboard") window.location.hash = "#dashboard";
      save();
      render(true);
      toast("Project created. Start with the items marked red.");
    },
    note: function (v, form) {
      var r = ROUTES.filter(function (x) { return x.id === ui.route; })[0];
      state.notes.push({ id: uid("n"), screen: r ? r.label : ui.route, text: v.text, at: nowStamp() });
      form.reset();
      commit("Note added.");
      var f = app.querySelector("#pt-note");
      if (f) f.focus();
    },
    "comp-update": function (v, form) {
      var c = findBy(state.compliance, form.getAttribute("data-id"));
      var wasMissing = !!c.missing;
      c.ref = v.ref;
      c.expires = v.expires || null;
      c.missing = false;
      ui.editing = null;
      if (wasMissing) addDoc(c.name, c.group === "Insurance" ? "Insurance" : "Approvals & permits", true);
      commit(c.name + " updated.");
    },
    "comp-add": function (v) {
      state.compliance.push({ id: uid("c"), name: v.name, group: v.group, ref: v.ref, expires: v.expires || null });
      commit(v.name + " added." + (v.expires ? " You'll get a reminder 30 days before it expires." : ""));
    },
    "trade-add": function (v) {
      state.trades.push({ id: uid("t"), trade: v.trade, business: v.business, licence: v.licence, insurance: v.insurance || null, workcover: !!v.workcover, tb: false, cert: "due" });
      commit(v.business + " added." + (v.insurance ? "" : " Ask them for their insurance before they start."));
    },
    "var-add": function (v, form) {
      var k = findBy(state.contracts, form.getAttribute("data-id"));
      k.variations.push({ id: uid("v"), text: v.text, amount: Number(v.amount) || 0, status: "pending", when: fmt(days(0)) });
      commit("Variation logged. Approve it before the work happens.");
    },
    "send-update": function (v) {
      var msg = UPDATE_TYPES[ui.composeType] + (v.note ? ". " + v.note : "");
      var subs = state.neighbours.subscribers.length;
      var area = DROP_AREAS[state.neighbours.dropArea].length;
      state.neighbours.updates.push({ id: uid("u"), type: ui.composeType, when: v.date, note: msg + " (" + fmtDay(v.date) + " from " + v.time + ")", reached: subs });
      commit("Sent to " + subs + " subscriber" + (subs === 1 ? "" : "s") + ". Print " + Math.max(0, area - subs) + " copies for the letterboxes.");
    },
    "add-sub": function (v) {
      state.neighbours.subscribers.push({ addr: v.addr, channel: v.channel });
      commit(v.addr + " signed up for updates by " + v.channel + ".");
    },
    "dilap-add": function (v) {
      state.dilapidation.push({ id: uid("d"), addr: v.addr, adjoining: !!v.adjoining, pre: null, by: "", copy: false, refused: false, post: false });
      if (v.adjoining) state.handoverNeeded.push("Dilapidation report: " + v.addr);
      commit(v.addr + " added.");
    },
    "doc-add": function (v) {
      addDoc(v.name, v.folder, !!v.handover);
      ui.docFolder = v.folder;
      commit(v.name + " filed under " + v.folder + ".");
    },
    project: function (v) {
      Object.keys(v).forEach(function (k) {
        state.project[k] = k === "budget" ? Number(v[k]) || 0 : v[k];
      });
      commit("Project details saved.");
    },
    share: function (v) {
      var folders = [].concat(v.folders || []);
      if (!folders.length) {
        toast("Pick at least one folder to share.");
        return;
      }
      ui.shareLink = { who: v.who, folders: folders, expires: days(7), url: "https://app.obiab.example/s/" + Math.random().toString(36).slice(2, 10) };
      render();
      toast("Read-only link created for " + v.who + ". It expires in 7 days.");
    }
  };

  // ---------- events ----------

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el || el.tagName === "INPUT") return;
    var fn = ACTIONS[el.getAttribute("data-action")];
    if (fn) {
      e.preventDefault();
      fn(el);
    }
  });

  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.tagName === "INPUT" && el.hasAttribute("data-action")) {
      var fn = ACTIONS[el.getAttribute("data-action")];
      if (fn) fn(el);
    }
  });

  document.addEventListener("input", function (e) {
    if (e.target.getAttribute("data-input") === "doc-search") {
      ui.docQuery = e.target.value;
      render();
    }
  });

  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-form]");
    if (!form) return;
    e.preventDefault();
    var fn = FORMS[form.getAttribute("data-form")];
    if (fn) fn(values(form), form);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (ui.notesOpen) {
      ui.notesOpen = false;
      render();
      var b = app.querySelector(".pt-notes-btn");
      if (b) b.focus();
    } else if (ui.navOpen) {
      ui.navOpen = false;
      render();
      var m = app.querySelector(".pt-menu");
      if (m) m.focus();
    }
  });

  window.addEventListener("hashchange", function () {
    // The skip link (#main) jumps to the content; it isn't a screen.
    if (window.location.hash === "#main") return;
    ui.route = routeFromHash();
    ui.navOpen = false;
    ui.editing = null;
    render(true);
  });

  ui.route = routeFromHash();
  render();

  // On the shared Artifact, offer page comments when this viewer can use them.
  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("comments").then(function (c) {
      if (c) {
        ui.commentsReady = true;
        render();
      }
    });
  }
})();
