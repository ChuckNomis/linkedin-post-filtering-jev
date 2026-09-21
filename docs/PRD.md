# Product Requirements Document (PRD)

**Project Name:** LinkedIn Post Filter (Jev-Powered Chrome Extension)  
**Version:** 1.1.0 (Open-Source / GitHub Release)

## 1. Overview

Finding relevant job postings on LinkedIn is difficult due to the high volume of non-hiring content (promotions, thought leadership, memes). This project is a client-side Chrome Extension that visually filters a user's LinkedIn feed in real-time. It uses **Jev (TypeSafe AI)** to evaluate every post in the feed against a user's highly specific job search criteria (role and seniority level), highlighting relevant jobs, marking irrelevant jobs, and dimming non-job posts entirely.

## 2. Target Audience

* **Primary:** Professionals across any industry (Software Engineering, HR, Product Management, etc.) actively looking for jobs on LinkedIn.
* **Technical Proficiency:** Comfortable cloning a GitHub repository, enabling Chrome Developer Mode, and generating their own Jev API key.

## 3. Core Features

1. **Bring Your Own Key (BYOK):** A secure options page for users to input and store their Jev API key locally.
2. **Dynamic Search Criteria:** A comprehensive settings menu where users can define their exact job search parameters (e.g., Target Roles: "Backend Engineer, AI Developer, Product Manager" and Target Levels: "Mid, Senior").
3. **Real-Time DOM Observation:** Seamlessly watches the LinkedIn feed as the user scrolls, capturing newly loaded posts and sending them to the evaluation worker.
4. **AI-Powered Classification (Green/Yellow/Red):** Uses Jev's `Choice` primitive to strictly categorize posts into three buckets:
   * **Green (Good Match):** It is a job post AND matches the user's specific role/level criteria.
   * **Yellow (Other Job):** It is a job post, but DOES NOT match the user's criteria.
   * **Red (Not a Job):** It is not a job post at all (memes, thought leadership, standard updates).
5. **Non-Destructive UI Injection:** Modifies the styling of existing LinkedIn post containers based on the Jev classification without breaking site functionality.

## 4. Architecture & Components

### 4.1. `manifest.json` (Manifest V3)

* **Permissions:** `storage` (for API key and search settings), `activeTab`, `scripting`.
* **Host Permissions:** `*://*.linkedin.com/*`
* **Background:** Service worker (`background.js`).
* **Content Scripts:** Injected into `linkedin.com/feed/*`.
* **Options Page:** `options.html`.

### 4.2. `options.html` & `options.js` (Settings)

* **API Key Input:** Password-type field for the Jev API Key.
* **Target Roles Input:** A text input or tag-based system (e.g., "Backend", "AI", "HR", "Product Management").
* **Target Levels Input:** Checkboxes or text input for seniority (e.g., "Junior", "Mid", "Senior", "Director", "Management").
* **Storage:** Saves all user preferences using `chrome.storage.local` so they can be injected into the prompt.

### 4.3. `content.js` (The Watcher & Highlighter)

* Initializes a `MutationObserver` targeting LinkedIn's feed container.
* Extracts `innerText` from new `.feed-shared-update-v2` elements.
* Sends the text payload directly to `background.js` via `chrome.runtime.sendMessage`.
* Listens for the AI classification response and applies CSS styles:
  * **Green (`good_match`):** `border-left: 6px solid #4CAF50; background-color: rgba(76, 175, 80, 0.05);` (Highlight)
  * **Yellow (`other_job`):** `border-left: 6px solid #FFEB3B; opacity: 0.7;` (Noticeable but muted)
  * **Red (`not_job`):** `opacity: 0.15; filter: grayscale(100%);` (Heavily dimmed/ignored)

### 4.4. `background.js` (The Evaluator & Prompt Builder)

* Listens for messages from `content.js`.
* Retrieves the Jev API key, Target Roles, and Target Levels from `chrome.storage.local`.
* Dynamically constructs the Jev prompt instructions using the retrieved settings.
* Executes the fetch request to `https://api.typesafe.ai/v1/systemone` and returns the decision.

## 5. API & Prompt Strategy (Jev System One)

The extension relies on building a dynamic payload. The `background.js` script will interpolate the user's settings into the `criteria` object before sending it to Jev.

**Dynamic Payload Structure:**

```json
{
  "model": "jev-latest",
  "state": "<POST_TEXT_FROM_LINKEDIN>",
  "questions": {
    "match_level": {
      "type": "choice",
      "instructions": "Analyze this LinkedIn post and categorize it based on whether it is a job opportunity, and if so, whether it matches the user's specific search criteria.",
      "criteria": {
        "good_match": "The post is actively hiring or advertising a job AND it matches the roles: [USER_ROLES] at the seniority levels: [USER_LEVELS].",
        "other_job": "The post is actively hiring or advertising a job, BUT it does NOT match the user's specified roles or levels.",
        "not_job": "The post is NOT a job advertisement. It is general content, advice, promotions, memes, or thought leadership."
      }
    }
  }
}
```
*(Note: `[USER_ROLES]` and `[USER_LEVELS]` will be programmatically replaced by the values saved in the options page).*

## 6. Installation & Distribution

* **Phase 1:** Open-source GitHub repository. Users will download the repo and install it locally via Chrome's `Load unpacked` feature in Developer Mode.
* **Phase 2 (Optional):** Chrome Web Store publication.

## 7. Success Metrics

* **Dynamic Accuracy:** Jev successfully differentiates between a job post for a "Senior Backend Engineer" (Green) and a "Junior Marketing Associate" (Yellow) based purely on user settings.
* **Latency:** Post classification and UI update occurs in under 1 second per post.
* **Visual Clarity:** The user can seamlessly scroll their feed, easily spotting green matches while red noise fades into the background.