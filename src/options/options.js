const form = document.getElementById("settings-form");
const apiKeyInput = document.getElementById("apiKey");
const targetRolesInput = document.getElementById("targetRoles");
const levelCheckboxes = document.querySelectorAll("#targetLevels input[type=checkbox]");
const statusEl = document.getElementById("status");

function loadSettings() {
  chrome.storage.local.get(["apiKey", "targetRoles", "targetLevels"], (data) => {
    apiKeyInput.value = data.apiKey || "";
    targetRolesInput.value = data.targetRoles || "";
    const savedLevels = data.targetLevels || [];
    levelCheckboxes.forEach((cb) => {
      cb.checked = savedLevels.includes(cb.value);
    });
  });
}

function saveSettings(event) {
  event.preventDefault();

  const targetLevels = Array.from(levelCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  const settings = {
    apiKey: apiKeyInput.value.trim(),
    targetRoles: targetRolesInput.value.trim(),
    targetLevels,
  };

  chrome.storage.local.set(settings, () => {
    statusEl.textContent = "Settings saved.";
    setTimeout(() => (statusEl.textContent = ""), 2000);
  });
}

form.addEventListener("submit", saveSettings);
document.addEventListener("DOMContentLoaded", loadSettings);
