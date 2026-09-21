# LinkedIn Post Filter (Jev-Powered)

A client-side Chrome Extension (Manifest V3) that filters your LinkedIn feed and search results in real time using [Jev](https://typesafe.ai) AI classification. Posts are highlighted, dimmed, or marked based on whether they're job postings matching your search criteria.

## Status

Working end-to-end, verified live against `linkedin.com/feed` and `linkedin.com/search/results/*` with a real Jev API key. See Known Limitations below for what's not covered yet.

## Features

- **BYOK** — bring your own Jev API key, stored locally, never sent anywhere but the Jev API.
- **Custom criteria** — set target roles (free text) and seniority levels (chip selector) in the options page.
- **Live classification** — a `MutationObserver` watches the feed/search results as you scroll and classifies new posts as they appear.
- **Visual triage**:
  - 🟩 **Good match** — green left border, subtle highlight.
  - 🟨 **Other job** — yellow left border, dimmed.
  - ⬛ **Not a job** — heavily grayed out and desaturated.

## Project Structure

```
manifest.json           Manifest V3 config (paths below are relative to this)
src/
  background.js         Service worker: builds Jev prompts, calls the API, retries on 429/529
  content/
    content.js           MutationObserver watcher + DOM classifier/highlighter
    content.css           Highlight/dim styles for classified posts
  options/
    options.html          Settings UI markup
    options.js             Settings UI logic (load/save chrome.storage.local)
    options.css             Settings UI styles
icons/                  Extension icons
```

## Local Development

1. Clone this repo.
2. Go to `chrome://extensions`, enable **Developer Mode**.
3. Click **Load unpacked** and select this folder.
4. Click the extension icon and enter your Jev API key (get one at https://console.typesafe.ai/keys) and your search criteria, then **Save Settings**.
5. Visit `linkedin.com/feed` or run a search and open the **Posts** tab — posts should be classified within ~1s of appearing.
6. After pulling changes or editing any file, reload the extension from `chrome://extensions` (the reload icon on its card) for changes to take effect. If a change touches `manifest.json` specifically, toggle the extension off and back on rather than just clicking reload — that ensures Chrome fully re-registers content script matches.

## Known Limitations

- **"Recommended for you" sidebar widget** — LinkedIn's people-recommendation module in the feed matches the same DOM shape as a real post, so it also gets classified and styled. Harmless, just occasionally unexpected.
- **No request batching/caching** — each post triggers its own API call; scrolling fast can fire many concurrent requests. There's exponential backoff on `429`/`529`, but no client-side rate limiting or de-duplication of previously-seen posts yet.
- **No visible error state in the UI beyond dimming logic** — a post that fails classification (e.g. bad/missing API key) is marked internally (`data-jev-processed="error"`) but isn't visually distinguished from an unprocessed one. Check the background service worker's console (`chrome://extensions` → **service worker** link) if posts aren't getting classified.
- **Selector coupling to LinkedIn's DOM** — LinkedIn ships fully hashed/atomic CSS classes with no stable names, so the extension keys off `div[role="listitem"][componentkey^="update-card-focus"]`. This is a real DOM attribute (more stable than class names) but LinkedIn could still change it, which would require a selector update in `src/content/content.js`.
- **Chrome Web Store packaging not started** — currently distributed as source, loaded unpacked.

## Privacy

Your Jev API key and search settings are stored only in `chrome.storage.local` on your machine. Post text is sent directly from your browser to the Jev API for classification — no other third party is involved.

## License

[MIT](./LICENSE)
