let lastRequestTime = 0;

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "ai-ask-selection",
    title: "Ask AI: \"%s\"",
    contexts: ["selection"]
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  // Check if enabled before processing
  const s = await browser.storage.local.get('extensionEnabled');
  if (s.extensionEnabled === false) return; // Do nothing if disabled

  if (info.menuItemId === "ai-ask-selection") {
    browser.tabs.sendMessage(tab.id, { action: "context_menu_trigger", text: info.selectionText });
  }
});

async function handleChat(userText) {
  const now = Date.now();
  if (now - lastRequestTime < 1000) return { error: "Please wait a moment." };
  lastRequestTime = now;

  const s = await browser.storage.local.get(null);
  
  // Global Disable Check
  if (s.extensionEnabled === false) return { error: "Extension is disabled." };

  const provider = s.provider || 'google';
  const history = s.chatHistory || [];
  const newUserMsg = { role: "user", parts: [{ text: userText }], timestamp: Date.now() };
  const fullHistory = [...history, newUserMsg];
  const systemPrompt = s.systemPrompt || "Be concise.";
  let responseText = "";

  try {
    if (provider === 'google') responseText = await callGoogle(s, userText, fullHistory, systemPrompt);
    else if (provider === 'ollama') responseText = await callOllama(s, fullHistory, systemPrompt);
    else if (provider === 'groq' || provider === 'openrouter') responseText = await callOpenAIStyle(s, provider, fullHistory, systemPrompt);
    else return { error: "Unknown Provider" };

    const newModelMsg = { role: "model", parts: [{ text: responseText }], timestamp: Date.now() };
    const updatedHistory = [...fullHistory, newModelMsg].slice(-20);
    await browser.storage.local.set({ chatHistory: updatedHistory });

    return { answer: responseText };
  } catch (e) {
    console.error(e);
    return { error: e.message || "API Error" };
  }
}

// ... (callGoogle, callOllama, callOpenAIStyle functions remain identical to previous step) ...
async function callGoogle(s, text, history, sys) {
  const apiKey = s.key_google; if (!apiKey) throw new Error("Google API Key missing.");
  const model = s.selectedModel || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const apiContents = history.map(m => ({ role: m.role, parts: m.parts }));
  const body = { contents: apiContents, systemInstruction: { parts: [{ text: sys }] } };
  if (s.useSearch) body.tools = [{ google_search: {} }];
  const res = await fetch(url, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

async function callOllama(s, history, sys) {
  const host = (s.ollamaHost || "http://localhost:11434").replace(/\/$/, '');
  const model = s.selectedModel || "llama3";
  const messages = [{ role: "system", content: sys }, ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.parts[0].text }))];
  const res = await fetch(`${host}/api/chat`, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: model, messages: messages, stream: false }) });
  if (!res.ok) throw new Error("Ollama connection failed.");
  const data = await res.json();
  return data.message.content;
}

async function callOpenAIStyle(s, provider, history, sys) {
  const apiKey = s[`key_${provider}`]; if (!apiKey) throw new Error(`${provider} API Key missing.`);
  const endpoints = { groq: "https://api.groq.com/openai/v1/chat/completions", openrouter: "https://openrouter.ai/api/v1/chat/completions" };
  const model = s.selectedModel || (provider === 'groq' ? "llama3-8b-8192" : "mistralai/mistral-7b-instruct");
  const messages = [{ role: "system", content: sys }, ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.parts[0].text }))];
  const res = await fetch(endpoints[provider], { method: "POST", headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://localhost', 'X-Title': 'AI Selector Ext' } : {}) }, body: JSON.stringify({ model: model, messages: messages }) });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

// --- Listeners ---
browser.runtime.onMessage.addListener(req => {
  if (req.action === "get_gemini_response") return handleChat(req.text);
  if (req.action === "manual_trigger") {
    browser.tabs.query({ active: true, currentWindow: true }).then(t => { if(t[0]) browser.tabs.sendMessage(t[0].id, { action: "toggle_mode" }); });
  }
});

browser.commands.onCommand.addListener(async (command) => {
  // Check if enabled first, unless we are toggling the state itself
  const s = await browser.storage.local.get('extensionEnabled');
  const isEnabled = s.extensionEnabled !== false;

  if (command === "toggle_global_state") {
    const newState = !isEnabled;
    await browser.storage.local.set({ extensionEnabled: newState });
    
    // Broadcast to all tabs
    const tabs = await browser.tabs.query({});
    tabs.forEach(t => browser.tabs.sendMessage(t.id, { action: "global_state_update", state: newState }).catch(() => {}));
  }
  
  if (command === "toggle_selection_mode") {
    if (!isEnabled) return; // Do nothing if disabled
    browser.tabs.query({ active: true, currentWindow: true }).then(t => { if(t[0]) browser.tabs.sendMessage(t[0].id, { action: "toggle_mode" }); });
  }
});