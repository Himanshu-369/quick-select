let lastRequestTime = 0;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ai-ask-selection",
    title: "Ask AI: \"%s\"",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const s = await chrome.storage.local.get('extensionEnabled');
  if (s.extensionEnabled === false) return;

  if (info.menuItemId === "ai-ask-selection") {
    chrome.tabs.sendMessage(tab.id, { action: "context_menu_trigger", text: info.selectionText });
  }
});

async function logAppError(provider, errorMsg, reqDetails) {
  const s = await chrome.storage.local.get('appLogs');
  const logs = s.appLogs ||[];
  logs.push({ timestamp: Date.now(), provider, error: errorMsg, request: reqDetails });
  if (logs.length > 30) logs.shift(); // Keep last 30 logs
  await chrome.storage.local.set({ appLogs: logs });
}

async function handleChat(userText) {
  const now = Date.now();
  if (now - lastRequestTime < 1000) return { error: "Please wait a moment." };
  lastRequestTime = now;

  const s = await chrome.storage.local.get(null);

  if (s.extensionEnabled === false) return { error: "Extension is disabled." };

  const provider = s.provider || 'google';
  const history = s.chatHistory ||[];
  const newUserMsg = { role: "user", parts: [{ text: userText }], timestamp: Date.now() };
  const fullHistory = [...history, newUserMsg];
  const systemPrompt = s.systemPrompt || "Be concise.";
  let responseText = "";

  try {
    if (provider === 'google') {
      responseText = await callGoogle(s, userText, fullHistory, systemPrompt);
    } else if (provider === 'ollama') {
      responseText = await callOllama(s, fullHistory, systemPrompt);
    } else if (['groq', 'openrouter', 'sambanova', 'cerebras', 'nvidia'].includes(provider)) {
      responseText = await callOpenAIStyle(s, provider, fullHistory, systemPrompt);
    } else {
      throw new Error("Unknown Provider");
    }

    const newModelMsg = { role: "model", parts: [{ text: responseText }], timestamp: Date.now() };
    const updatedHistory = [...fullHistory, newModelMsg].slice(-20);
    await chrome.storage.local.set({ chatHistory: updatedHistory });

    return { answer: responseText };
  } catch (e) {
    console.error(e);
    await logAppError(provider, e.message || "API Error", { text: userText, model: s.selectedModel });
    return { error: e.message || "API Error. Check logs in the bubble menu." };
  }
}

async function callGoogle(s, text, history, sys) {
  const apiKey = s.key_google; if (!apiKey) throw new Error("Google API Key missing.");
  const model = s.selectedModel || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const apiContents = history.map(m => ({ role: m.role, parts: m.parts }));
  const body = { contents: apiContents, systemInstruction: { parts: [{ text: sys }] } };
  if (s.useSearch) body.tools = [{ google_search: {} }];
  
  const res = await fetch(url, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

async function callOllama(s, history, sys) {
  const host = (s.ollamaHost || "http://localhost:11434").replace(/\/$/, '');
  const model = s.selectedModel || "llama3";
  const messages = [{ role: "system", content: sys }, ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.parts[0].text }))];
  
  const res = await fetch(`${host}/api/chat`, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: model, messages: messages, stream: false }) });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return data.message.content;
}

async function callOpenAIStyle(s, provider, history, sys) {
  const apiKey = s[`key_${provider}`]; if (!apiKey) throw new Error(`${provider} API Key missing.`);
  const endpoints = { 
    groq: "https://api.groq.com/openai/v1/chat/completions", 
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    sambanova: "https://api.sambanova.ai/v1/chat/completions",
    cerebras: "https://api.cerebras.ai/v1/chat/completions",
    nvidia: "https://integrate.api.nvidia.com/v1/chat/completions"
  };
  
  const defaultModels = {
    groq: "llama3-8b-8192",
    openrouter: "mistralai/mistral-7b-instruct",
    sambanova: "Meta-Llama-3.1-8B-Instruct",
    cerebras: "llama3.1-8b",
    nvidia: "meta/llama3-8b-instruct"
  };

  const model = s.selectedModel || defaultModels[provider];
  const messages = [{ role: "system", content: sys }, ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.parts[0].text }))];
  
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://localhost';
    headers['X-Title'] = 'AI Selector Ext';
  }

  const payload = { model: model, messages: messages };
  
  const res = await fetch(endpoints[provider], { method: "POST", headers, body: JSON.stringify(payload) });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices[0].message.content;
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "get_gemini_response") {
    handleChat(req.text).then(sendResponse);
    return true; 
  }
  if (req.action === "manual_trigger") {
    chrome.tabs.query({ active: true, currentWindow: true }).then(t => { if(t[0]) chrome.tabs.sendMessage(t[0].id, { action: "toggle_mode" }); });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const s = await chrome.storage.local.get('extensionEnabled');
  const isEnabled = s.extensionEnabled !== false;

  if (command === "toggle_global_state") {
    const newState = !isEnabled;
    await chrome.storage.local.set({ extensionEnabled: newState });

    const tabs = await chrome.tabs.query({});
    tabs.forEach(t => chrome.tabs.sendMessage(t.id, { action: "global_state_update", state: newState }).catch(() => {}));
  }

  if (command === "toggle_selection_mode") {
    if (!isEnabled) return;
    chrome.tabs.query({ active: true, currentWindow: true }).then(t => { if(t[0]) chrome.tabs.sendMessage(t[0].id, { action: "toggle_mode" }); });
  }
});