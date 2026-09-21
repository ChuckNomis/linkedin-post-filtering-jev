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

function processPost(postEl) {
  if (postEl.getAttribute(PROCESSED_ATTR)) return;
  postEl.setAttribute(PROCESSED_ATTR, "pending");

  const text = extractPostText(postEl);
  if (!text) return;

  chrome.runtime.sendMessage({ type: "CLASSIFY_POST", text }, (response) => {
    if (chrome.runtime.lastError) {
      postEl.setAttribute(PROCESSED_ATTR, "error");
      return;
    }
    if (response?.error) {
      postEl.setAttribute(PROCESSED_ATTR, "error");
      return;
    }
    postEl.setAttribute(PROCESSED_ATTR, "done");
    applyClassification(postEl, response?.classification);
  });
}

function scanFeed(root = document) {
  root.querySelectorAll(POST_SELECTOR).forEach(processPost);
}

function initObserver() {
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

  observer.observe(document.body, { childList: true, subtree: true });
  scanFeed();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initObserver);
} else {
  initObserver();
}
