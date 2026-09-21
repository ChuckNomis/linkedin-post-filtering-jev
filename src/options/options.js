const form = document.getElementById("settings-form");
const apiKeyInput = document.getElementById("apiKey");
const targetRolesInput = document.getElementById("targetRoles");
const levelChips = document.querySelectorAll("#targetLevels .chip");
const statusEl = document.getElementById("status");
const toggleKeyVisibilityBtn = document.getElementById("toggleKeyVisibility");

function loadSettings() {
  chrome.storage.local.get(["apiKey", "targetRoles", "targetLevels"], (data) => {
    apiKeyInput.value = data.apiKey || "";
    targetRolesInput.value = data.targetRoles || "";
    const savedLevels = data.targetLevels || [];
    levelChips.forEach((chip) => {
      chip.classList.toggle("active", savedLevels.includes(chip.dataset.value));
    });
  });
}

function saveSettings(event) {
  event.preventDefault();

  const targetLevels = Array.from(levelChips)
    .filter((chip) => chip.classList.contains("active"))
    .map((chip) => chip.dataset.value);

  const settings = {
    apiKey: apiKeyInput.value.trim(),
    targetRoles: targetRolesInput.value.trim(),
    targetLevels,
  };

  chrome.storage.local.set(settings, () => {
    statusEl.textContent = "Settings saved.";
    statusEl.classList.add("visible");
    setTimeout(() => statusEl.classList.remove("visible"), 2000);
  });
}

function toggleKeyVisibility() {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleKeyVisibilityBtn.setAttribute("aria-label", isPassword ? "Hide API key" : "Show API key");
}

levelChips.forEach((chip) => {
  chip.addEventListener("click", () => chip.classList.toggle("active"));
});

form.addEventListener("submit", saveSettings);
toggleKeyVisibilityBtn.addEventListener("click", toggleKeyVisibility);
document.addEventListener("DOMContentLoaded", loadSettings);
