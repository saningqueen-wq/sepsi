(function () {
  "use strict";

  const START = "No estaba buscándote de la manera en que se buscan las respuestas";

  function applyJustify(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-blog-variant="timeline"] .amino-content-paragraph, [data-blog-variant="timeline"] p').forEach(function (el) {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (text.startsWith(START)) {
        el.style.textAlign = "justify";
        el.style.textJustify = "inter-word";
        el.style.hyphens = "auto";
      }
    });
  }

  function run() {
    applyJustify(document);
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) applyJustify(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
