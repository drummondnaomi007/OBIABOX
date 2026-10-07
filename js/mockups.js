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

  // Quote comparison: award a quote.
  var quotes = document.querySelector("[data-quotes]");
  if (quotes) {
    var awardMsg = document.querySelector("[data-award-msg]");
    var awardStatus = document.querySelector("[data-award-status]");
    quotes.addEventListener("click", function (e) {
      var btn = e.target.closest(".mock-award");
      if (!btn) return;
      var chosen = btn.closest(".mock-quote");
      quotes.querySelectorAll(".mock-quote").forEach(function (q) {
        q.classList.toggle("awarded", q === chosen);
        q.classList.toggle("passed", q !== chosen);
        q.querySelector(".mock-award").textContent = q === chosen ? "Awarded ✓" : "Award";
      });
      var name = chosen.querySelector(".mock-q-name").firstChild.textContent.trim();
      var risky = chosen.querySelector(".pill-red");
      awardStatus.textContent = "Awarded";
      awardStatus.className = "pill " + (risky ? "pill-red" : "pill-green");
      awardMsg.textContent = risky
        ? "Awarded to " + name + ", but they can't start until they provide proof of insurance. Their quote also leaves out materials, so check your budget."
        : "Awarded to " + name + ". A contract record has been started from the accepted quote, and the other trades get a thank-you note.";
    });
  }

  // Contract admin: approve or query a variation.
  var approve = document.querySelector("[data-approve]");
  var query = document.querySelector("[data-query]");
  if (approve && query) {
    var note = document.querySelector("[data-var-note]");
    var pill = document.querySelector("[data-var-pill]");
    var actions = document.querySelector("[data-var-actions]");
    approve.addEventListener("click", function () {
      note.textContent = "Approved in writing today";
      pill.className = "pill pill-green";
      document.querySelector("[data-var-total]").textContent = "+$1,250";
      document.querySelector("[data-revised]").textContent = "$37,150";
      actions.innerHTML = '<span class="mock-muted">Approval saved to the contract record and sent to the trade.</span>';
      var status = document.querySelector("[data-contract-status]");
      if (status) {
        status.textContent = "Up to date";
        status.className = "pill pill-green";
      }
    });
    query.addEventListener("click", function () {
      note.textContent = "Query sent to Northside Framing · waiting for reply";
      actions.innerHTML = "<span class=\"mock-muted\">Work on V2 shouldn’t start until it’s approved.</span>";
    });
  }

  // Inspection booking flow.
  var insp = document.querySelector("[data-insp]");
  if (insp) {
    var steps = insp.querySelectorAll("[data-step]");
    var stepper = insp.querySelectorAll("[data-stepper] li");
    var nextFromReady = insp.querySelector('[data-step="1"] [data-next="2"]');
    var blocked = insp.querySelector("[data-blocked]");
    var missing = insp.querySelector("[data-missing]");
    var frameStage = insp.querySelector("[data-frame-stage]");
    var frameStatus = insp.querySelector("[data-frame-status]");
    var outcome = insp.querySelector("[data-outcome]");
    var result = insp.querySelector("[data-result]");
    var slot = "Thu 8:00am";

    function show(n) {
      steps.forEach(function (st) {
        st.hidden = st.getAttribute("data-step") !== String(n);
      });
      stepper.forEach(function (li, i) {
        li.classList.toggle("on", i === n - 1);
        li.classList.toggle("done", i < n - 1);
      });
    }

    function setFrame(cls, text) {
      frameStage.className = cls;
      frameStatus.textContent = text;
    }

    function markUploaded() {
      missing.classList.add("ok");
      missing.querySelector(".mock-box").textContent = "✓";
      this.remove();
      nextFromReady.disabled = false;
      blocked.textContent = "All set";
    }
    insp.querySelector("[data-upload]").addEventListener("click", markUploaded);

    insp.querySelector("[data-slots]").addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      this.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("on", b === btn);
      });
      slot = btn.textContent;
    });

    insp.querySelectorAll("[data-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var n = parseInt(btn.getAttribute("data-next"), 10);
        if (n === 3) {
          insp.querySelector("[data-booked-title]").textContent = "Booked: " + slot;
          setFrame("current", "Booked " + slot);
        }
        show(n);
      });
    });

    insp.querySelector("[data-pass]").addEventListener("click", function () {
      result.hidden = true;
      outcome.hidden = false;
      outcome.className = "mock-outcome pass";
      outcome.innerHTML = "<strong>Frame inspection passed.</strong> The $8,975 “Frame complete” payment to Northside Framing is ready for you to approve, and the plasterer can start. Next up: lock-up.";
      setFrame("passed", "Passed today");
    });

    insp.querySelector("[data-defects]").addEventListener("click", function () {
      result.hidden = true;
      outcome.hidden = false;
      outcome.className = "mock-outcome defects";
      outcome.innerHTML = "<strong>2 defects noted.</strong> Missing tie-down at the rear corner and an undersized lintel over the laundry door, both sent to Northside Framing with the surveyor’s photos. The payment stays on hold. Book a re-inspection once they’re fixed.";
      setFrame("defect", "Re-inspection needed");
    });

    insp.querySelector("[data-reset]").addEventListener("click", function () {
      missing.classList.remove("ok");
      missing.querySelector(".mock-box").textContent = "";
      if (!missing.querySelector("[data-upload]")) {
        var up = document.createElement("button");
        up.type = "button";
        up.className = "mock-award ghost small";
        up.setAttribute("data-upload", "");
        up.textContent = "Upload";
        missing.appendChild(up);
        up.addEventListener("click", markUploaded);
      }
      nextFromReady.disabled = true;
      blocked.textContent = "Upload the truss certificate first";
      result.hidden = false;
      outcome.hidden = true;
      setFrame("current", "Ready to book");
      show(1);
    });
  }

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
