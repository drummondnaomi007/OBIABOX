// Guides page: tick-off steps (saved on this device), progress, print one guide.
document.addEventListener("DOMContentLoaded", function () {
  var KEY = "obiab-guides-v1";
  var memory = {};

  function load() {
    try {
      return JSON.parse(window.localStorage.getItem(KEY)) || {};
    } catch (e) {
      return memory;
    }
  }

  function save(data) {
    memory = data;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* ticks still work for this visit */
    }
  }

  var state = load();

  document.querySelectorAll("[data-guide]").forEach(function (guide) {
    var id = guide.getAttribute("data-guide");
    var boxes = guide.querySelectorAll(".guide-steps input[type=checkbox]");
    var progress = guide.querySelector("[data-progress]");
    var ticked = state[id] || [];

    function refresh() {
      var done = 0;
      boxes.forEach(function (box) {
        if (box.checked) done += 1;
        box.closest("li").classList.toggle("done", box.checked);
      });
      progress.textContent = done === boxes.length ? "All done ✓" : done + " of " + boxes.length + " done";
      guide.classList.toggle("complete", done === boxes.length);
    }

    boxes.forEach(function (box, i) {
      box.checked = ticked.indexOf(i) !== -1;
      box.addEventListener("change", function () {
        var list = [];
        boxes.forEach(function (b, j) {
          if (b.checked) list.push(j);
        });
        state[id] = list;
        save(state);
        refresh();
      });
    });

    guide.querySelector("[data-reset-guide]").addEventListener("click", function () {
      boxes.forEach(function (b) {
        b.checked = false;
      });
      state[id] = [];
      save(state);
      refresh();
    });

    guide.querySelector("[data-print-guide]").addEventListener("click", function () {
      document.body.classList.add("printing-guide");
      guide.classList.add("print-me");
      window.print();
    });

    refresh();
  });

  window.addEventListener("afterprint", function () {
    document.body.classList.remove("printing-guide");
    document.querySelectorAll(".print-me").forEach(function (g) {
      g.classList.remove("print-me");
    });
  });
});
