document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
  }

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var printBtn = document.querySelector("[data-print]");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      window.print();
    });
  }

  // Demo-only forms: show a message instead of submitting anywhere.
  document.querySelectorAll("[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector(".demo-msg");
      if (msg) msg.hidden = false;
    });
  });
});
