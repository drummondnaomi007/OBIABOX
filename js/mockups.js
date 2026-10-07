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

  // Document vault.
  var vault = document.querySelector("[data-vault]");
  if (vault) {
    var FOLDERS = [
      "Approvals & permits",
      "Insurance",
      "Trades & contracts",
      "Inspections",
      "End-of-job certificates",
      "Neighbours & council",
      "Plans & engineering"
    ];
    // status: ok | warn | missing | old. handover: needed in the final build file.
    var DOCS = [
      { name: "Certificate of Consent", folder: 0, link: "You", date: "Issued 2 Sep", status: "ok", label: "Current", handover: true },
      { name: "Building permit BP-0000", folder: 0, link: "Example Building Surveying", date: "Issued 10 Oct", status: "ok", label: "Current", handover: true },
      { name: "Planning permit: not required (council letter)", folder: 0, link: "City of Example", date: "28 Aug", status: "ok", label: "On file", handover: true },
      { name: "White Card: Sam Taylor", folder: 0, link: "You", date: "Uploaded 1 Sep", status: "ok", label: "Current", handover: false },
      { name: "Construction insurance policy", folder: 1, link: "You", date: "Renews 30 Jun", status: "ok", label: "Current", handover: true },
      { name: "Public liability: owner", folder: 1, link: "You", date: "Renews in 62 days", status: "ok", label: "Current", handover: false },
      { name: "Contract: Northside Framing", folder: 2, link: "Frame carpentry", date: "Signed 8 Jan", status: "ok", label: "Signed", handover: true },
      { name: "Public liability: Northside Framing", folder: 2, link: "Frame carpentry", date: "Expires in 21 days", status: "warn", label: "Expiring", handover: false },
      { name: "Contract: Flowright Plumbing", folder: 2, link: "Plumbing", date: "Signed 15 Dec", status: "ok", label: "Signed", handover: true },
      { name: "Public liability: Bright Spark Electrical", folder: 2, link: "Electrical", date: "Requested 3 times", status: "missing", label: "Missing", handover: false },
      { name: "Footings inspection: passed", folder: 3, link: "Footings stage", date: "18 Nov", status: "ok", label: "Passed", handover: true },
      { name: "Slab inspection: passed", folder: 3, link: "Slab stage", date: "2 Dec", status: "ok", label: "Passed", handover: true },
      { name: "Roof truss design certificate", folder: 3, link: "Frame stage", date: "Uploaded 3 Feb", status: "ok", label: "On file", handover: true },
      { name: "Final inspection certificate", folder: 3, link: "Final stage", date: "After final inspection", status: "missing", label: "Missing", handover: true },
      { name: "Plumbing compliance certificate", folder: 4, link: "Flowright Plumbing", date: "Due at completion", status: "missing", label: "Missing", handover: true },
      { name: "Electrical safety certificate", folder: 4, link: "Bright Spark Electrical", date: "Due at completion", status: "missing", label: "Missing", handover: true },
      { name: "Waterproofing certificate", folder: 4, link: "Out to tender", date: "Due at completion", status: "missing", label: "Missing", handover: true },
      { name: "Asset protection permit + bond receipt", folder: 5, link: "City of Example", date: "Paid 20 Oct", status: "ok", label: "On file", handover: true },
      { name: "Before photos (24)", folder: 5, link: "Asset protection", date: "22 Oct", status: "ok", label: "Locked", handover: true },
      { name: "Dilapidation report: 10 Smith St", folder: 5, link: "Neighbour", date: "12 Mar", status: "ok", label: "On file", handover: true },
      { name: "Dilapidation report: 14 Smith St", folder: 5, link: "Neighbour", date: "Needed before demolition", status: "missing", label: "Missing", handover: true },
      { name: "Neighbour notice log (4 sends)", folder: 5, link: "Neighbours", date: "Last sent 2 Dec", status: "ok", label: "On file", handover: true },
      { name: "Architectural plans rev C", folder: 6, link: "Issued for construction", date: "4 Oct", status: "ok", label: "Current", handover: true },
      { name: "Architectural plans rev B", folder: 6, link: "Replaced by rev C", date: "12 Sep", status: "old", label: "Superseded", handover: false },
      { name: "Structural engineering", folder: 6, link: "Issued for construction", date: "4 Oct", status: "ok", label: "Current", handover: true },
      { name: "Soil report", folder: 6, link: "Site", date: "20 Aug", status: "ok", label: "On file", handover: true }
    ];
    var ICON = ["📄", "🛡", "👷", "🔍", "✅", "🏘", "📐"];
    var PILL = { ok: "pill-green", warn: "pill-amber", missing: "pill-red", old: "pill-grey" };
    var SNAPS = [
      { replace: "Plumbing compliance certificate", link: "Flowright Plumbing", date: "Snapped today", label: "Current",
        toast: "Read as a plumbing compliance certificate and filed under End-of-job certificates › Flowright Plumbing. One more ticked off for handover." },
      { add: { name: "Timber delivery docket", folder: 2, link: "Frame carpentry", date: "Snapped today", status: "ok", label: "On file", handover: false },
        toast: "Read as a delivery docket and filed under Trades & contracts › Northside Framing." }
    ];

    var folderEl = vault.querySelector("[data-folders]");
    var listEl = vault.querySelector("[data-docs]");
    var emptyEl = vault.querySelector("[data-docs-empty]");
    var searchEl = vault.querySelector("[data-vault-search]");
    var filterEl = vault.querySelector("[data-vault-filter]");
    var toastEl = vault.querySelector("[data-vault-toast]");
    var current = { folder: -1, filter: "all", q: "", fresh: null };
    var snapCount = 0;

    function toast(msg) {
      toastEl.textContent = msg;
      toastEl.hidden = false;
    }

    function renderFolders() {
      folderEl.innerHTML = "";
      var names = ["All documents"].concat(FOLDERS);
      names.forEach(function (name, i) {
        var idx = i - 1;
        var count = DOCS.filter(function (d) { return idx === -1 || d.folder === idx; }).length;
        var alert = DOCS.some(function (d) { return (idx === -1 || d.folder === idx) && d.status === "missing"; });
        var b = document.createElement("button");
        b.type = "button";
        b.className = idx === current.folder ? "on" : "";
        var label = document.createElement("span");
        label.textContent = (idx === -1 ? "🗂" : ICON[idx]) + " " + name;
        var c = document.createElement("em");
        c.textContent = count;
        if (alert) c.className = "alert";
        b.appendChild(label);
        b.appendChild(c);
        b.addEventListener("click", function () {
          current.folder = idx;
          renderFolders();
          renderDocs();
        });
        folderEl.appendChild(b);
      });
    }

    function renderDocs() {
      var q = current.q.toLowerCase();
      var shown = DOCS.filter(function (d) {
        if (current.folder !== -1 && d.folder !== current.folder) return false;
        if (current.filter !== "all" && d.status !== current.filter) return false;
        if (q && (d.name + " " + d.link).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      listEl.innerHTML = "";
      shown.forEach(function (d) {
        var li = document.createElement("li");
        if (d === current.fresh) li.className = "fresh";
        var icon = document.createElement("span");
        icon.className = "mock-doc-icon";
        icon.textContent = ICON[d.folder];
        var body = document.createElement("span");
        body.className = "mock-doc-body";
        var name = document.createElement("strong");
        name.textContent = d.name;
        var meta = document.createElement("small");
        meta.textContent = FOLDERS[d.folder] + " · " + d.link + " · " + d.date;
        body.appendChild(name);
        body.appendChild(meta);
        var pill = document.createElement("span");
        pill.className = "pill " + PILL[d.status];
        pill.textContent = d.label;
        li.appendChild(icon);
        li.appendChild(body);
        li.appendChild(pill);
        listEl.appendChild(li);
      });
      emptyEl.hidden = shown.length > 0;
      renderHandover();
    }

    function renderHandover() {
      var needed = DOCS.filter(function (d) { return d.handover; });
      var ready = needed.filter(function (d) { return d.status === "ok"; });
      vault.querySelector("[data-hand-count]").textContent = ready.length + " of " + needed.length;
      vault.querySelector("[data-hand-bar]").style.width = Math.round((ready.length / needed.length) * 100) + "%";
      vault.querySelector("[data-hand-missing]").textContent = needed
        .filter(function (d) { return d.status !== "ok"; })
        .map(function (d) { return d.name; })
        .join(", ");
    }

    searchEl.addEventListener("input", function () {
      current.q = searchEl.value.trim();
      renderDocs();
    });

    filterEl.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      filterEl.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("on", b === btn);
      });
      current.filter = btn.getAttribute("data-filter");
      renderDocs();
    });

    vault.querySelector("[data-snap]").addEventListener("click", function () {
      var snap = SNAPS[snapCount];
      if (!snap) {
        toast("That's all the sample documents in this demo. In the app, you'd keep snapping as paperwork turns up.");
        return;
      }
      snapCount += 1;
      var doc;
      if (snap.replace) {
        doc = DOCS.filter(function (d) { return d.name === snap.replace; })[0];
        doc.status = "ok";
        doc.label = snap.label;
        doc.date = snap.date;
      } else {
        doc = snap.add;
        DOCS.push(doc);
      }
      current = { folder: doc.folder, filter: "all", q: "", fresh: doc };
      searchEl.value = "";
      filterEl.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-filter") === "all");
      });
      renderFolders();
      renderDocs();
      toast(snap.toast);
    });

    var sharePanel = vault.querySelector("[data-share-panel]");
    vault.querySelector("[data-share]").addEventListener("click", function () {
      sharePanel.hidden = !sharePanel.hidden;
    });
    vault.querySelector("[data-copy]").addEventListener("click", function () {
      sharePanel.hidden = true;
      toast("Demo: link copied. Example Building Surveying can view the folders you ticked for the next 7 days, read-only.");
    });
    vault.querySelector("[data-download]").addEventListener("click", function () {
      toast("Demo: in the app this downloads a zip of every document, sorted into folders, with a one-page index.");
    });

    renderFolders();
    renderDocs();
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
