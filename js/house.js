// Line-drawn house that "builds" as you scroll.
// - A floating build tracker (bottom right) draws the house in build stages
//   linked to how far down the page you are.
// - Each hero gets a faint plan-style house that draws itself on load.
// Purely decorative: hidden from screen readers, skipped when printing, and
// shown fully drawn (no motion) for people who prefer reduced motion.
(function () {
  var NS = "http://www.w3.org/2000/svg";

  // Build order. start/end are the slice of page scroll (0–1) each line draws over.
  var PARTS = [
    // Slab
    { d: "M8 142 H192", start: 0.0, end: 0.08, cls: "ground" },
    { d: "M38 142 V134 H162 V142", start: 0.04, end: 0.16 },
    // Frame
    { d: "M44 134 V82", start: 0.16, end: 0.24 },
    { d: "M156 134 V82", start: 0.18, end: 0.26 },
    { d: "M44 82 H156", start: 0.24, end: 0.32 },
    { d: "M72 134 V82 M100 134 V82 M128 134 V82", start: 0.26, end: 0.36, cls: "stud" },
    // Roof
    { d: "M32 86 L100 34 L168 86", start: 0.36, end: 0.5 },
    { d: "M128 56 V38 H140 V65", start: 0.46, end: 0.54 },
    // Lock-up: door and windows
    { d: "M88 134 V104 H112 V134", start: 0.54, end: 0.64 },
    { d: "M54 94 H78 V114 H54 Z", start: 0.6, end: 0.7 },
    { d: "M122 94 H146 V114 H122 Z", start: 0.64, end: 0.74 },
    { d: "M66 94 V114 M54 104 H78 M134 94 V114 M122 104 H146", start: 0.7, end: 0.8, cls: "detail" },
    // Handover: path, tree, front-door handle, a tick
    { d: "M100 142 C98 148 104 152 100 158", start: 0.8, end: 0.86, cls: "detail" },
    { d: "M178 142 V120 M178 124 C166 122 166 104 178 102 C190 104 190 122 178 124", start: 0.84, end: 0.94, cls: "detail" },
    { d: "M106 120 h0.5", start: 0.88, end: 0.9, cls: "detail" },
    { d: "M84 22 l8 8 l16 -16", start: 0.94, end: 1.0, cls: "tick" }
  ];

  var STAGES = [
    { at: 0.0, name: "Site set-out" },
    { at: 0.08, name: "Slab" },
    { at: 0.24, name: "Frame" },
    { at: 0.4, name: "Roof" },
    { at: 0.56, name: "Lock-up" },
    { at: 0.8, name: "Fixing" },
    { at: 0.97, name: "Handover ✓" }
  ];

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function buildSvg(extraClass, withGhost) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 200 160");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", "house-svg " + (extraClass || ""));
    if (withGhost) {
      PARTS.forEach(function (part) {
        var g = document.createElementNS(NS, "path");
        g.setAttribute("d", part.d);
        g.setAttribute("class", "house-ghost " + (part.cls || ""));
        svg.appendChild(g);
      });
    }
    var paths = PARTS.map(function (part, i) {
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", part.d);
      p.setAttribute("pathLength", "1");
      p.setAttribute("class", "house-line " + (part.cls || ""));
      p.style.setProperty("--i", i);
      svg.appendChild(p);
      return p;
    });
    return { svg: svg, paths: paths };
  }

  function clamp(n) {
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Hero art: draws once on load. Where the hero has a project card (home),
    // the house is drawn inside the card so it isn't hidden behind it.
    var hero = document.querySelector(".hero");
    if (hero) {
      var anim = reduceMotion ? "" : " animate";
      hero.classList.add("has-house");
      var card = hero.querySelector(".hero-card");
      if (card) {
        card.insertBefore(buildSvg("card-house" + anim).svg, card.firstChild);
      } else {
        hero.insertBefore(buildSvg("hero-house" + anim).svg, hero.firstChild);
      }
    }

    // Floating build tracker: draws with scroll.
    var tracker = document.createElement("div");
    tracker.className = "build-tracker";
    tracker.setAttribute("aria-hidden", "true");
    var t = buildSvg("tracker-house", true);
    var label = document.createElement("div");
    label.className = "build-stage";
    var bar = document.createElement("div");
    bar.className = "build-bar";
    var fill = document.createElement("span");
    bar.appendChild(fill);
    tracker.appendChild(t.svg);
    tracker.appendChild(label);
    tracker.appendChild(bar);
    document.body.appendChild(tracker);
    document.body.classList.add("has-tracker");

    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var progress = reduceMotion || max <= 0 ? 1 : clamp(window.scrollY / max);
      t.paths.forEach(function (p, i) {
        var part = PARTS[i];
        var local = clamp((progress - part.start) / (part.end - part.start));
        p.style.strokeDashoffset = String(1 - local);
      });
      var stage = STAGES[0].name;
      STAGES.forEach(function (s) {
        if (progress >= s.at) stage = s.name;
      });
      label.textContent = stage;
      fill.style.width = Math.round(progress * 100) + "%";
      tracker.classList.toggle("done", progress >= 0.97);
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  });
})();
