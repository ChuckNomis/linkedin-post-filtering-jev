const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";

function buildPrompt(postText, targetRoles, targetLevels) {
  const rolesStr = targetRoles || "any role";
  const levelsStr = (targetLevels && targetLevels.length) ? targetLevels.join(", ") : "any level";

  return {
    model: "jev-latest",
    state: postText,
    questions: {
      match_level: {
        type: "choice",
        instructions:
          "Analyze this LinkedIn post and categorize it based on whether it is a job opportunity, and if so, whether it matches the user's specific search criteria.",
        criteria: {
          good_match: `The post is actively hiring or advertising a job AND it matches the roles: ${rolesStr} at the seniority levels: ${levelsStr}.`,
          other_job:
            "The post is actively hiring or advertising a job, BUT it does NOT match the user's specified roles or levels.",
          not_job:
            "The post is NOT a job advertisement. It is general content, advice, promotions, memes, or thought leadership.",
        },
      },
    },
  };
}

async function classifyPost(postText) {
  const { apiKey, targetRoles, targetLevels } = await chrome.storage.local.get([
    "apiKey",
    "targetRoles",
    "targetLevels",
  ]);

  if (!apiKey) {
    return { error: "missing_api_key" };
  }

  const payload = buildPrompt(postText, targetRoles, targetLevels);
  const maxRetries = 3;

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(JEV_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const classification = data?.answers?.match_level?.choice;
        return { classification };
      }

      const isRetryable = response.status === 429 || response.status === 529;
      if (!isRetryable || attempt === maxRetries) {
        return { error: `jev_api_error_${response.status}` };
      }

      const backoffMs = 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  } catch (err) {
    return { error: "network_error", message: err.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "CLASSIFY_POST") {
    classifyPost(message.text).then(sendResponse);
    return true; // keep the message channel open for async response
  }
  return false;
});
