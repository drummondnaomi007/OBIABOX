// Interactions for the app mockups page (demo/app.html). Preview only:
// nothing here sends or stores anything.
document.addEventListener("DOMContentLoaded", function () {
  // Build-stage house on the dashboard.
  document.querySelectorAll("[data-house]").forEach(function (el) {
    if (window.OBIABHouse) {
      window.OBIABHouse.draw(el, parseFloat(el.getAttribute("data-house")) || 0);
    }
  });

  // Message chips update the neighbour's SMS preview.
  var chips = document.querySelector("[data-chips]");
  var msg = document.querySelector("[data-preview-msg]");
  var icon = document.querySelector("[data-preview-icon]");
  if (chips && msg && icon) {
    chips.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      chips.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("on", b === btn);
      });
      msg.textContent = btn.getAttribute("data-msg");
      icon.textContent = btn.getAttribute("data-icon");
    });
  }

  // Line sketches standing in for site photos.
  var SKETCH = {
    footpath: "M10 78 L50 20 M110 78 L70 20 M30 50 H90 M20 65 H100 M40 35 H80",
    kerb: "M0 40 H120 V48 H0 Z M0 62 C40 68 80 68 120 62",
    crossover: "M0 40 H40 L50 60 H70 L80 40 H120 M0 48 H38 M82 48 H120 M50 60 V78 M70 60 V78",
    pit: "M40 22 H80 V54 H40 Z M46 28 H74 V48 H46 Z M0 70 H120",
    tree: "M60 78 V42 M60 44 C40 44 36 14 60 10 C84 14 80 44 60 44 M30 78 H90",
    strip: "M0 50 H120 M0 70 H120 M10 50 l4 -6 l4 6 M40 50 l4 -6 l4 6 M70 50 l4 -6 l4 6 M100 50 l4 -6 l4 6"
  };
  var NS = "http://www.w3.org/2000/svg";
  document.querySelectorAll("[data-photo]").forEach(function (el) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 120 80");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", SKETCH[el.getAttribute("data-photo")] || "");
    svg.appendChild(p);
    el.appendChild(svg);
  });

  // Street map: click a lot to show its record.
  var card = document.querySelector("[data-lot-card]");
  if (card) {
    var title = card.querySelector("[data-lot-title]");
    var status = card.querySelector("[data-lot-status]");
    var sub = card.querySelector("[data-lot-sub]");
    var lots = document.querySelectorAll("[data-lot]");
    lots.forEach(function (lot) {
      lot.setAttribute("tabindex", "0");
      lot.setAttribute("role", "button");
      var parts = lot.getAttribute("data-lot").split("|");
      lot.setAttribute("aria-label", parts[0] + ": " + parts[1]);
      function select() {
        lots.forEach(function (l) {
          l.classList.toggle("selected", l === lot);
        });
        title.textContent = parts[0];
        status.textContent = parts[1];
        sub.textContent = parts[2];
      }
      lot.addEventListener("click", select);
      lot.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      });
      if (parts[0] === "14 Smith St") lot.classList.add("selected");
    });
  }
});
