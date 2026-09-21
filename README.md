# LinkedIn Post Filter (Jev-Powered)

A client-side Chrome Extension (Manifest V3) that filters your LinkedIn feed in real time using [Jev](https://typesafe.ai) AI classification. Posts are highlighted, dimmed, or marked based on whether they're job postings matching your search criteria.

See [`linkedin_job_filter_extension_prd.md`](./linkedin_job_filter_extension_prd.md) for the full product spec.

## Status

Early scaffold — see Implementation Plan below.

## Project Structure

```
manifest.json      Manifest V3 config
background.js       Service worker: builds Jev prompts, calls the API
content.js           MutationObserver watcher + DOM classifier/highlighter
content.css          Highlight/dim styles for classified posts
options.html/js/css  Settings UI (API key, target roles/levels)
icons/               Extension icons
```

## Local Development

1. Clone this repo.
2. Go to `chrome://extensions`, enable **Developer Mode**.
3. Click **Load unpacked** and select this folder.
4. Click the extension icon (or go to its options page) and enter your Jev API key and search criteria.
5. Visit `linkedin.com/feed` and scroll — posts should be classified within ~1s of appearing.

## Implementation Plan

1. **Scaffold (done)** — manifest, options page, background worker, content script, placeholder icons.
2. **Verify Jev API contract** — confirm exact request/response shape at `https://api.typesafe.ai/v1/systemone` (auth header, response field names) against real docs/account; adjust `background.js` parsing accordingly.
3. **Selector resilience** — validate `.feed-shared-update-v2` is still LinkedIn's current post container class; add a fallback selector list since LinkedIn changes class names periodically.
4. **Rate limiting / batching** — add a small queue in `content.js` to avoid firing many parallel fetches when a user scrolls fast (e.g. debounce + max concurrent requests).
5. **Caching** — hash post text and cache classification results in `chrome.storage.session` (or in-memory) to avoid re-classifying posts revisited during a session.
6. **Error/UX states** — surface a subtle indicator on posts that failed classification (e.g. missing API key) rather than leaving them unstyled; show a banner in the options page if the key is invalid.
7. **Manual QA** — load unpacked, test against a real LinkedIn feed with a real Jev key; verify green/yellow/red classification accuracy and confirm no layout breakage.
8. **Polish** — tag-based input for roles (optional), dark mode support for options page, README screenshots.
9. **Phase 2 (optional)** — package for Chrome Web Store submission (store listing assets, privacy policy for API key handling).

## Privacy

Your Jev API key and search settings are stored only in `chrome.storage.local` on your machine. Post text is sent directly from your browser to the Jev API for classification — no other third party is involved.
