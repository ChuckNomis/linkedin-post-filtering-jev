# LinkedIn Post Filter (Jev-Powered)

A client-side Chrome Extension (Manifest V3) that filters your LinkedIn feed in real time using [Jev](https://typesafe.ai) AI classification. Posts are highlighted, dimmed, or marked based on whether they're job postings matching your search criteria.

See [`docs/PRD.md`](./docs/PRD.md) for the full product spec.

## Status

Working end-to-end against a live LinkedIn feed and the real Jev API. See Implementation Plan below for remaining polish items.

## Project Structure

```
manifest.json           Manifest V3 config (paths below are relative to this)
src/
  background.js         Service worker: builds Jev prompts, calls the API
  content/
    content.js           MutationObserver watcher + DOM classifier/highlighter
    content.css           Highlight/dim styles for classified posts
  options/
    options.html          Settings UI markup
    options.js             Settings UI logic (load/save chrome.storage.local)
    options.css             Settings UI styles
icons/                  Extension icons
docs/
  PRD.md                Product requirements document
```

## Local Development

1. Clone this repo.
2. Go to `chrome://extensions`, enable **Developer Mode**.
3. Click **Load unpacked** and select this folder.
4. Click the extension icon (or go to its options page) and enter your Jev API key (get one at https://console.typesafe.ai/keys) and search criteria.
5. Visit `linkedin.com/feed` and scroll — posts should be classified within ~1s of appearing.

## Implementation Plan

1. **Scaffold (done)** — manifest, options page, background worker, content script, placeholder icons.
2. **Verify Jev API contract (done)** — confirmed against docs.typesafe.ai: endpoint, auth header, and `choice` answer shape (`answers.<id>.choice`).
3. **Selector resilience (done)** — LinkedIn now ships hashed/atomic CSS classes with no semantic names; switched to `div[role="listitem"][componentkey^="update-card-focus"]`, verified live.
4. **CORS fix (done)** — added `https://api.typesafe.ai/*` to `host_permissions` so the background fetch isn't blocked.
5. **Retry/backoff (done)** — exponential backoff added for `429`/`529` responses per API guidance.
6. **Known quirk** — LinkedIn's "Recommended for you" sidebar widget matches the same DOM shape as a real post and gets classified/styled too. Harmless but could be filtered out (e.g. by checking for a real post author link) if it bothers you.
7. **Rate limiting / batching** — add a small queue in `content.js` to avoid firing many parallel fetches when a user scrolls fast.
8. **Caching** — hash post text and cache classification results (session storage or in-memory) to avoid re-classifying posts revisited in the same session.
9. **Error/UX states** — surface a visible indicator on posts that failed classification (e.g. missing/invalid API key) rather than leaving them unstyled.
10. **Polish** — tag-based input for roles (optional), dark mode support for options page, README screenshots.
11. **Phase 2 (optional)** — package for Chrome Web Store submission (store listing assets, privacy policy for API key handling).

## Privacy

Your Jev API key and search settings are stored only in `chrome.storage.local` on your machine. Post text is sent directly from your browser to the Jev API for classification — no other third party is involved.
