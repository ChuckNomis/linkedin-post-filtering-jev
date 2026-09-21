const POST_SELECTOR = 'div[role="listitem"][componentkey^="update-card-focus"]';
const PROCESSED_ATTR = "data-jev-processed";
const CLASSIFICATION_CLASSES = {
  good_match: "jev-good-match",
  other_job: "jev-other-job",
  not_job: "jev-not-job",
};

function extractPostText(postEl) {
  return postEl.innerText?.trim().slice(0, 3000) ?? "";
}

function applyClassification(postEl, classification) {
  const className = CLASSIFICATION_CLASSES[classification];
  if (!className) return;
  Object.values(CLASSIFICATION_CLASSES).forEach((c) => postEl.classList.remove(c));
  postEl.classList.add(className);
}

function bump(attr) {
  const html = document.documentElement;
  html.setAttribute(attr, String(Number(html.getAttribute(attr) || "0") + 1));
}

function processPost(postEl) {
  bump("data-jev-dbg-processpost-called");
  if (postEl.getAttribute(PROCESSED_ATTR)) return;
  postEl.setAttribute(PROCESSED_ATTR, "pending");

  const text = extractPostText(postEl);
  document.documentElement.setAttribute("data-jev-dbg-last-text-len", String(text.length));
  if (!text) return;

  bump("data-jev-dbg-sendmessage-called");
  chrome.runtime.sendMessage({ type: "CLASSIFY_POST", text }, (response) => {
    bump("data-jev-dbg-callback-fired");
    if (chrome.runtime.lastError) {
      document.documentElement.setAttribute("data-jev-dbg-lasterror", chrome.runtime.lastError.message || "unknown");
      postEl.setAttribute(PROCESSED_ATTR, "error");
      return;
    }
    if (response?.error) {
      document.documentElement.setAttribute("data-jev-dbg-response-error", response.error);
      postEl.setAttribute(PROCESSED_ATTR, "error");
      return;
    }
    postEl.setAttribute(PROCESSED_ATTR, "done");
    applyClassification(postEl, response?.classification);
  });
}

function scanFeed(root = document) {
  const matches = root.querySelectorAll(POST_SELECTOR);
  bump("data-jev-dbg-scanfeed-called");
  document.documentElement.setAttribute("data-jev-dbg-last-scan-count", String(matches.length));
  matches.forEach(processPost);
}

function initObserver() {
  document.documentElement.setAttribute("data-jev-dbg-init-ran", "true");
  const feedContainer = document.body;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.(POST_SELECTOR)) {
          processPost(node);
        } else {
          scanFeed(node);
        }
      });
    }
  });

  observer.observe(feedContainer, { childList: true, subtree: true });
  scanFeed();
}

document.documentElement.setAttribute("data-jev-dbg-script-loaded", "true");
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initObserver);
} else {
  initObserver();
}
