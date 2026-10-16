// Waitlist form on the contact page. Uses, in order:
//   1. a Tally form (tallyFormId in js/config.js), embedded in the card;
//   2. a form service endpoint (waitlistEndpoint), keeping this page's own form;
//   3. otherwise the original email-app form (mailto).
document.addEventListener("DOMContentLoaded", function () {
  var cfg = window.OBIAB_CONFIG || {};
  var form = document.querySelector("[data-waitlist-form]");
  if (!form) return;
  var card = form.closest("[data-waitlist]");
  var hint = card.querySelector("[data-waitlist-hint]");
  var fallback = card.querySelector("[data-waitlist-fallback]");

  if (cfg.tallyFormId) {
    var id = encodeURIComponent(cfg.tallyFormId);
    var frame = document.createElement("iframe");
    frame.src = "https://tally.so/embed/" + id + "?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";
    frame.title = "Join the Owner Builder in a Box waitlist";
    frame.loading = "lazy";
    frame.className = "waitlist-frame";
    frame.setAttribute("data-tally-src", frame.src);
    form.replaceWith(frame);
    if (hint) hint.textContent = "Takes about a minute. We'll only email you about Owner Builder in a Box.";
    if (fallback) {
      fallback.innerHTML = 'Form not loading? <a href="https://tally.so/r/' + id + '" target="_blank" rel="noopener">Open it in a new tab</a>, or email <strong>hello@tradiesbureau.com</strong>.';
    }
    // Tally's helper resizes the form to fit its content.
    var helper = document.createElement("script");
    helper.src = "https://tally.so/widgets/embed.js";
    helper.async = true;
    helper.onload = function () {
      if (window.Tally && window.Tally.loadEmbeds) window.Tally.loadEmbeds();
    };
    document.body.appendChild(helper);
    return;
  }

  if (cfg.waitlistEndpoint) {
    if (hint) hint.textContent = "We'll only email you about Owner Builder in a Box.";
    if (fallback) fallback.hidden = true;
    var status = document.createElement("p");
    status.className = "waitlist-status";
    status.setAttribute("role", "status");
    status.hidden = true;
    form.appendChild(status);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      var data = {};
      new FormData(form).forEach(function (value, key) {
        data[key] = value;
      });
      data._subject = "Owner Builder in a Box waitlist";
      button.disabled = true;
      button.textContent = "Sending…";
      status.hidden = true;

      fetch(cfg.waitlistEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) {
          if (!r.ok) throw new Error("status " + r.status);
          form.reset();
          status.className = "waitlist-status ok";
          status.textContent = "You're on the list. Thanks! We'll be in touch.";
          button.textContent = "Joined ✓";
        })
        .catch(function () {
          status.className = "waitlist-status error";
          status.textContent = "Sorry, that didn't send. Please try again, or email hello@tradiesbureau.com.";
          button.disabled = false;
          button.textContent = "Join the waitlist";
          if (fallback) fallback.hidden = false;
        })
        .then(function () {
          status.hidden = false;
        });
    });
  }
});
