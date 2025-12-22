const defaultModels = {
  google: "gemini-1.5-flash",
  groq: "llama3-8b-8192",
  openrouter: "mistralai/mistral-7b-instruct",
  ollama: "llama3"
};

const providers = {
  google: { label: "Google AI Studio Key", url: "https://generativelanguage.googleapis.com/v1beta/models?key=" },
  groq: { label: "Groq API Key", url: "https://api.groq.com/openai/v1/models" },
  openrouter: { label: "OpenRouter Key", url: "https://openrouter.ai/api/v1/models" },
  ollama: { label: "None Needed", url: "/api/tags" }
};

let currentConfig = {};

document.addEventListener('DOMContentLoaded', async () => {
  const data = await browser.storage.local.get(null);
  currentConfig = data;
  
  applyTheme(data.theme || 'light');
  
  const isEnabled = data.extensionEnabled !== false;
  document.getElementById('extensionEnabled').checked = isEnabled;

  const provider = data.provider || 'google';
  document.getElementById('providerSelect').value = provider;
  
  document.getElementById('apiKey').value = data[`key_${provider}`] || '';
  document.getElementById('ollamaHost').value = data.ollamaHost || 'http://localhost:11434';
  document.getElementById('systemPrompt').value = data.systemPrompt || '';
  document.getElementById('useSearch').checked = data.useSearch || false;
  document.getElementById('confirmTrigger').checked = data.confirmTrigger !== false;

  updateUIForProvider(provider);
  
  const cachedModels = data[`models_${provider}`] || [];
  populateModelSelect(cachedModels, data.selectedModel);
});

document.getElementById('providerSelect').onchange = (e) => {
  const p = e.target.value;
  updateUIForProvider(p);
  document.getElementById('apiKey').value = currentConfig[`key_${p}`] || '';
  const cachedModels = currentConfig[`models_${p}`] || [];
  populateModelSelect(cachedModels, null);
};

function updateUIForProvider(provider) {
  const info = providers[provider];
  const isOllama = provider === 'ollama';
  document.getElementById('ollamaHostField').style.display = isOllama ? 'block' : 'none';
  const keyField = document.getElementById('apiKeyField');
  if (isOllama) {
    keyField.style.display = 'none';
  } else {
    keyField.style.display = 'block';
    document.getElementById('apiKeyLabel').innerText = info.label;
  }
  document.getElementById('googleSettings').style.display = provider === 'google' ? 'block' : 'none';
}

function populateModelSelect(models, selected) {
  const select = document.getElementById('modelSelect');
  select.innerHTML = '';
  if (!models || models.length === 0) {
    const opt = document.createElement('option'); opt.text = "No models fetched"; select.add(opt); return;
  }
  models.forEach(m => {
    const opt = document.createElement('option'); opt.value = m.id; opt.text = m.name || m.id;
    if (m.id === selected) opt.selected = true;
    select.add(opt);
  });
}

document.getElementById('fetchModelsBtn').onclick = async () => {
  const provider = document.getElementById('providerSelect').value;
  const apiKey = document.getElementById('apiKey').value;
  const ollamaHost = document.getElementById('ollamaHost').value.replace(/\/$/, '');
  const statusDiv = document.getElementById('fetchStatus');
  statusDiv.innerText = "Fetching..."; statusDiv.className = "status-msg";

  try {
    let models = [];
    if (provider === 'google') {
      if (!apiKey) throw new Error("API Key required");
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      models = data.models.map(m => ({ id: m.name.replace('models/', ''), name: m.displayName }));
    } else if (provider === 'groq') {
      if (!apiKey) throw new Error("API Key required");
      const res = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': `Bearer ${apiKey}` } });
      const data = await res.json();
      models = data.data.map(m => ({ id: m.id, name: m.id }));
    } else if (provider === 'openrouter') {
      if (!apiKey) throw new Error("API Key required");
      const res = await fetch('https://openrouter.ai/api/v1/models');
      const data = await res.json();
      models = data.data.map(m => ({ id: m.id, name: m.name }));
    } else if (provider === 'ollama') {
      const res = await fetch(`${ollamaHost}/api/tags`);
      const data = await res.json();
      models = data.models.map(m => ({ id: m.name, name: m.name }));
    }
    const saveObj = {}; saveObj[`models_${provider}`] = models;
    await browser.storage.local.set(saveObj);
    currentConfig[`models_${provider}`] = models;
    populateModelSelect(models, models[0]?.id);
    statusDiv.innerText = `Success! Found ${models.length} models.`; statusDiv.className = "status-msg success";
  } catch (err) {
    statusDiv.innerText = "Error: " + err.message; statusDiv.className = "status-msg error";
  }
};

document.getElementById('saveBtn').onclick = async () => {
  const provider = document.getElementById('providerSelect').value;
  const settings = {
    extensionEnabled: document.getElementById('extensionEnabled').checked,
    provider: provider,
    ollamaHost: document.getElementById('ollamaHost').value,
    selectedModel: document.getElementById('modelSelect').value,
    systemPrompt: document.getElementById('systemPrompt').value,
    useSearch: document.getElementById('useSearch').checked,
    confirmTrigger: document.getElementById('confirmTrigger').checked,
    theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
  };

  if (provider !== 'ollama') settings[`key_${provider}`] = document.getElementById('apiKey').value;

  await browser.storage.local.set(settings);
  
  const tabs = await browser.tabs.query({});
  tabs.forEach(t => browser.tabs.sendMessage(t.id, { action: "global_state_update", state: settings.extensionEnabled }).catch(() => {}));

  const btn = document.getElementById('saveBtn');
  btn.innerText = "Saved!"; btn.style.background = "#10b981";
  setTimeout(() => { btn.innerText = "Save Settings"; btn.style.background = ""; }, 1500);
};

// --- MODERN ICONS ---
// Sun Icon (Filled)
const sunIcon = `<svg viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" /></svg>`;

// Moon Icon (Filled)
const moonIcon = `<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd" /></svg>`;

document.getElementById('themeToggle').onclick = () => {
  const isDark = document.body.classList.contains('dark-mode');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  browser.storage.local.set({ theme: newTheme });
};

function applyTheme(theme) {
  document.body.classList.toggle('dark-mode', theme === 'dark');
  document.getElementById('themeToggle').innerHTML = theme === 'dark' ? sunIcon : moonIcon;
}

document.getElementById('exportBtn').onclick = async () => {
  const data = await browser.storage.local.get(null);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ai_selector_config.json'; a.click();
};

document.getElementById('importBtn').onclick = () => {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = async (re) => { await browser.storage.local.set(JSON.parse(re.target.result)); location.reload(); };
    reader.readAsText(e.target.files[0]);
  };
  input.click();
};
