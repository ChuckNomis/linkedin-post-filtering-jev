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
      postEl.removeAttribute(PROCESSED_ATTR);
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
  const matches = root.querySelectorAll(POST_SELECTOR);
  console.log("[JevFilter] scanFeed found", matches.length, "posts on", location.pathname);
  matches.forEach(processPost);
}

function initObserver() {
  console.log("[JevFilter] initObserver running on", location.pathname);
  const feedContainer = document.querySelector("main") || document.body;

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

console.log("[JevFilter] content script loaded, readyState =", document.readyState, "url =", location.href);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initObserver);
} else {
  initObserver();
}
