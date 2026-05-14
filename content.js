(function() {
    let isSelectionMode = false;
    let isDragging = false;
    let pendingRequest = null;
    let isExtensionEnabled = true;
    let isEasySelectionEnabled = false;
    let currentPanelView = 'history'; // 'history' or 'logs'

    // Easy Selection State Variables
    let easySelectState = 0; // 0: hover line, 1: expanding selection, 2: selection finished
    let easySelectAnchor = null;
    let justLocked = false;
    let mouseDownPos = {x: 0, y: 0};
    let lastHoveredTextNode = null;

    // --- 1. Shadow DOM Setup ---
    const shadowHost = document.createElement('div');
    shadowHost.id = 'gemini-extension-root';
    document.body.appendChild(shadowHost);
    const shadow = shadowHost.attachShadow({ mode: 'open' });

    // --- 2. Styles ---
    const style = document.createElement('style');
    style.textContent = `
        :host { 
            --p: #2563eb; --bg: #ffffff; --t: #111827; --b: #e5e7eb;
            --code-bg: #f3f4f6; --pre-bg: #1f2937; --pre-t: #f9fafb;
            --sh: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        :host(.dark) { 
            --p: #3b82f6; --bg: #1e293b; --t: #f8fafc; --b: #334155; 
            --code-bg: #0f172a; --sh: 0 10px 25px -5px rgba(0,0,0,0.5); 
        }

        .spinner { border: 3px solid rgba(0, 0, 0, 0.1); border-left-color: var(--p); border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .md-content { line-height: 1.6; font-size: 14px; }
        .md-content strong { font-weight: 700; color: var(--p); }
        .md-content pre { background: var(--pre-bg); color: var(--pre-t); padding: 12px; border-radius: 8px; overflow-x: auto; font-family: ui-monospace, monospace; }
        .md-content code { background: var(--code-bg); padding: 3px 6px; border-radius: 6px; font-family: ui-monospace, monospace; font-size: 0.9em; }
        .md-content h1, .md-content h2, .md-content h3 { margin: 12px 0 6px; font-size: 1.1em; color: var(--t); }
        .md-content ul, .md-content ol { padding-left: 20px; margin: 8px 0; }
        .md-content p { margin: 0 0 10px; }

        #pill { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); background: var(--p); color: #ffffff; padding: 6px 6px 6px 18px; border-radius: 99px; font-size: 13px; font-weight: 600; display: none; align-items: center; gap: 14px; z-index: 2147483647; box-shadow: var(--sh); animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        
        #pill .status-dot { width: 8px; height: 8px; background: #ffffff; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,0.3); transition: background-color 0.3s, box-shadow 0.3s; }
        #pill .status-dot.ready { background: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4); animation: pulse-green 2s infinite; }
        #pill .status-dot.error { background: #ef4444; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.4); animation: pulse-red 1s infinite; }
        @keyframes pulse-green { 0% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.8; } }
        @keyframes pulse-red { 0% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.8; } }
        #pill button { background: #ffffff; color: var(--p); border: none; padding: 6px 16px; border-radius: 99px; cursor: pointer; font-weight: 700; font-size: 12px; }
        #pill button:hover { opacity: 0.95; transform: scale(1.02); }

        #confirm-popup { position: fixed; z-index: 2147483647; background: var(--bg); border: 1px solid var(--b); border-radius: 50px; padding: 4px; display: none; box-shadow: var(--sh); animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .confirm-btn { width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; transition: background 0.2s; margin: 0 2px; }
        #btn-yes { background: #e6f4ea; color: #1e8e3e; } #btn-yes:hover { background: #ceead6; }
        #btn-no { background: #fce8e6; color: #d93025; } #btn-no:hover { background: #fad2cf; }

        #bubble { position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; background: var(--p); border-radius: 14px; display: flex; align-items: center; justify-content: center; z-index: 2147483647; cursor: grab; box-shadow: var(--sh); transition: transform 0.2s; }
        #bubble:hover { transform: translateY(-2px); }
        #bubble svg { width: 24px; height: 24px; fill: white; pointer-events: none; }

        #popup, #history { 
            position: fixed; z-index: 2147483647; background: var(--bg); color: var(--t); 
            border-radius: 12px; box-shadow: var(--sh); border: 1px solid var(--b); 
            display: none; overflow: hidden;
            transition: left 0.15s ease-out, top 0.15s ease-out; 
        }
        #popup { padding: 16px; max-width: 360px; min-width: 220px; }
        #history { width: 380px; height: 550px; bottom: 80px; right: 20px; flex-direction: column; }
        .h-head { padding: 14px 18px; border-bottom: 1px solid var(--b); display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
        .h-list { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 16px; }
        .msg-container { display: flex; flex-direction: column; gap: 4px; max-width: 85%; }
        .msg-container.u { align-self: flex-end; align-items: flex-end; } .msg-container.m { align-self: flex-start; align-items: flex-start; }
        .msg { padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; word-break: break-word; }
        .u .msg { background: var(--p); color: #fff; border-bottom-right-radius: 2px; } .m .msg { background: var(--b); color: var(--t); border-bottom-left-radius: 2px; }
        .meta { font-size: 10px; color: var(--t); opacity: 0.6; display: flex; gap: 8px; align-items: center; }
        .copy-btn { cursor: pointer; background: none; border: none; font-size: 12px; padding: 0; opacity: 0.5; transition: opacity 0.2s; } .copy-btn:hover { opacity: 1; }
        .clr-btn { cursor: pointer; background: transparent; border: none; color: var(--t); font-size: 11px; font-weight: 600; text-transform: uppercase; opacity: 0.7; } 
        .clr-btn:hover { opacity: 1; text-decoration: underline; }
        .clr-btn.danger { color: #d93025; }
    `;
    shadow.appendChild(style);

    // --- 3. Elements ---
    const bubble = document.createElement('div'); bubble.id = 'bubble';
    bubble.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    const pill = document.createElement('div'); pill.id = 'pill';
    pill.innerHTML = `<div class="status-dot"></div><span>Selection Active</span><button id="stop">Done</button>`;
    const confirmPopup = document.createElement('div'); confirmPopup.id = 'confirm-popup';
    confirmPopup.innerHTML = `<button class="confirm-btn" id="btn-yes" title="Ask AI">✔</button><button class="confirm-btn" id="btn-no" title="Cancel">✖</button>`;
    const popup = document.createElement('div'); popup.id = 'popup';
    const historyPanel = document.createElement('div'); historyPanel.id = 'history';

    shadow.appendChild(bubble); shadow.appendChild(pill); shadow.appendChild(confirmPopup); shadow.appendChild(popup); shadow.appendChild(historyPanel);

    // --- 4. Logic ---

    function updateGlobalState(enabled) {
        isExtensionEnabled = enabled;
        shadowHost.style.display = enabled ? 'block' : 'none';
        if (!enabled) { toggleSelectionMode(false); historyPanel.style.display = 'none'; popup.style.display = 'none'; }
    }
    chrome.storage.local.get(['extensionEnabled', 'easySelection']).then(s => { 
        updateGlobalState(s.extensionEnabled !== false); 
        isEasySelectionEnabled = s.easySelection || false;
    });

    async function checkApiStatus() {
        const s = await chrome.storage.local.get(null);
        const dot = pill.querySelector('.status-dot');
        const provider = s.provider || 'google';
        let hasKey = (provider === 'ollama') ? true : !!s[`key_${provider}`];
        if (hasKey) { dot.classList.add('ready'); dot.classList.remove('error'); }
        else { dot.classList.remove('ready'); dot.classList.remove('error'); }
    }

    function parseMarkdown(text) {
        if (!text) return "";
        let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '<br><br>').replace(/\n- (.*)/g, '<br>• $1');
        return `<div class="md-content">${html}</div>`;
    }

    async function processText(text, clientX, clientY) {
        confirmPopup.style.display = 'none';
        popup.style.display = 'block';
        const x = Math.min(clientX, window.innerWidth - 380);
        const y = Math.min(clientY + 15, window.innerHeight - 200);
        popup.style.left = `${x}px`; popup.style.top = `${y}px`;
        popup.innerHTML = `<div style="display:flex;align-items:center"><div class="spinner"></div> <span>Thinking...</span></div>`;

        window.getSelection().removeAllRanges();

        const res = await chrome.runtime.sendMessage({ action: "get_gemini_response", text: text });
        const dot = pill.querySelector('.status-dot');

        if (res.error) {
            if (res.error.toLowerCase().includes("wait") || res.error.includes("429")) { dot.classList.remove('ready'); dot.classList.add('error'); }
            popup.innerHTML = `<div style="color:#ef4444;font-weight:bold">Error</div><div style="margin-top:8px; font-size:12px;">${res.error}</div>`;
        } else {
            checkApiStatus(); popup.innerHTML = parseMarkdown(res.answer);
        }
    }

    async function renderPanelContent() {
        const s = await chrome.storage.local.get(['chatHistory', 'appLogs']);
        const history = s.chatHistory || [];
        const logs = s.appLogs ||[];

        const title = currentPanelView === 'history' ? 'Chat History' : 'Error Logs';
        const toggleBtnText = currentPanelView === 'history' ? 'View Logs' : 'View History';

        historyPanel.innerHTML = `
            <div class="h-head">
                <span>${title}</span>
                <div style="display:flex; gap:12px;">
                    <button class="clr-btn" id="toggle-view">${toggleBtnText}</button>
                    <button class="clr-btn danger" id="clr-data">Clear</button>
                </div>
            </div>
            <div class="h-list" id="hl"></div>
        `;

        historyPanel.querySelector('#toggle-view').onclick = () => {
            currentPanelView = currentPanelView === 'history' ? 'logs' : 'history';
            renderPanelContent();
        };

        historyPanel.querySelector('#clr-data').onclick = async () => {
            if (confirm(`Clear ${title}?`)) {
                if (currentPanelView === 'history') await chrome.storage.local.set({ chatHistory:[] });
                else await chrome.storage.local.set({ appLogs:[] });
                renderPanelContent();
            }
        };

        const list = historyPanel.querySelector('#hl');

        if (currentPanelView === 'history') {
            history.forEach(t => {
                const time = t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                const rawText = t.parts[0].text;
                const div = document.createElement('div');
                div.className = `msg-container ${t.role === 'user' ? 'u' : 'm'}`;
                div.innerHTML = `<div class="msg">${t.role === 'model' ? parseMarkdown(rawText) : rawText}</div><div class="meta">${time}<button class="copy-btn" title="Copy">📋</button></div>`;
                div.querySelector('.copy-btn').onclick = () => { navigator.clipboard.writeText(rawText); };
                list.appendChild(div);
            });
            if (history.length === 0) list.innerHTML = `<div style="text-align:center; opacity:0.5; margin-top:20px;">No history.</div>`;
        } else {
            logs.slice().reverse().forEach(l => {
                const time = new Date(l.timestamp).toLocaleString();
                const div = document.createElement('div');
                div.style.cssText = "background: var(--code-bg); padding: 10px; border-radius: 8px; font-family: monospace; font-size: 11px; word-break: break-all;";
                div.innerHTML = `
                    <div style="color: #ef4444; font-weight: bold; margin-bottom: 4px;">[${time}] ${l.provider}</div>
                    <div style="margin-bottom: 6px;"><strong>Error:</strong> ${l.error}</div>
                    <div style="opacity: 0.7; font-size: 10px;"><strong>Req:</strong> ${JSON.stringify(l.request)}</div>
                `;
                list.appendChild(div);
            });
            if (logs.length === 0) list.innerHTML = `<div style="text-align:center; opacity:0.5; margin-top:20px;">No logs found.</div>`;
        }
        list.scrollTop = list.scrollHeight;
    }

    // --- Hydrophobic Effect & Easy Selection Logic ---
    document.addEventListener('mousemove', (e) => {
        if (!isExtensionEnabled) return;

        // Hydrophobic effect for the popup
        if (popup.style.display === 'block' && !e.ctrlKey && !e.metaKey) {
            const rect = popup.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const centerX = rect.left + (rect.width / 2);
            const centerY = rect.top + (rect.height / 2);
            const vecX = centerX - mouseX;
            const vecY = centerY - mouseY;
            const dist = Math.sqrt(vecX*vecX + vecY*vecY);
            const threshold = 180;

            if (dist < threshold && dist > 0) {
                const targetCenterX = mouseX + (vecX / dist) * threshold;
                const targetCenterY = mouseY + (vecY / dist) * threshold;
                let newLeft = targetCenterX - (rect.width / 2);
                let newTop = targetCenterY - (rect.height / 2);
                const padding = 20;
                const winW = window.innerWidth;
                const winH = window.innerHeight;
                newLeft = Math.max(padding, Math.min(newLeft, winW - rect.width - padding));
                newTop = Math.max(padding, Math.min(newTop, winH - rect.height - padding));
                popup.style.left = `${newLeft}px`;
                popup.style.top = `${newTop}px`;
            }
        }

        // Easy Selection Core Logic
        if (isSelectionMode && isEasySelectionEnabled && !isDragging && easySelectState !== 2) {
            if (shadowHost.contains(e.target)) return;

            let range;
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(e.clientX, e.clientY);
            } else if (document.caretPositionFromPoint) { // Fallback for Firefox
                const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
                if (pos) {
                    range = document.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                }
            }

            if (range && range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
                const textNode = range.startContainer;
                // Only update if text is valid and we hovered over a new text node to avoid jitter
                if (textNode.textContent.trim().length > 0 && lastHoveredTextNode !== textNode) {
                    lastHoveredTextNode = textNode;
                    const sel = window.getSelection();
                    sel.removeAllRanges();

                    if (easySelectState === 0) {
                        // State 0: Just highlight the current line we are hovering over
                        const newRange = document.createRange();
                        newRange.selectNodeContents(textNode.parentElement);
                        sel.addRange(newRange);
                    } else if (easySelectState === 1 && easySelectAnchor) {
                        // State 1: We clicked to lock start point. Now expand selection dynamically!
                        sel.setBaseAndExtent(easySelectAnchor, 0, textNode.parentElement, textNode.parentElement.childNodes.length);
                    }
                }
            }
        }
    });

    // --- 5. Event Listeners ---
    confirmPopup.querySelector('#btn-yes').onclick = () => { if(pendingRequest) { processText(pendingRequest.text, pendingRequest.x, pendingRequest.y); pendingRequest = null; } confirmPopup.style.display = 'none'; };
    confirmPopup.querySelector('#btn-no').onclick = () => { confirmPopup.style.display = 'none'; pendingRequest = null; };

    bubble.style.right = '20px'; bubble.style.bottom = '20px';
    bubble.onmousedown = (e) => {
        if (!isExtensionEnabled) return;
        if (e.button !== 0) return;
        isDragging = false;
        const startX = e.clientX, startY = e.clientY;
        const rect = bubble.getBoundingClientRect();
        const startRight = window.innerWidth - rect.right;
        const startBottom = window.innerHeight - rect.bottom;
        const onMouseMove = (me) => { if (Math.abs(me.clientX - startX) > 4 || Math.abs(me.clientY - startY) > 4) { isDragging = true; bubble.style.right = (startRight + (startX - me.clientX)) + 'px'; bubble.style.bottom = (startBottom + (startY - me.clientY)) + 'px'; } };
        const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); if (!isDragging) toggleSelectionMode(); };
        document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
    };

    function toggleSelectionMode(state) {
        if (!isExtensionEnabled) return;
        isSelectionMode = (state !== undefined) ? state : !isSelectionMode;
        document.body.style.cursor = isSelectionMode ? 'crosshair' : 'default';
        pill.style.display = isSelectionMode ? 'flex' : 'none';
        
        // Reset easy selection state
        easySelectState = 0;
        easySelectAnchor = null;
        lastHoveredTextNode = null;

        if (!isSelectionMode) { 
            popup.style.display = 'none'; 
            confirmPopup.style.display = 'none'; 
            window.getSelection().removeAllRanges();
        }
    }

    pill.querySelector('#stop').onclick = () => toggleSelectionMode(false);
    document.addEventListener('keydown', (e) => {
        if (!isExtensionEnabled) return;
        if (e.key === 'Escape') { toggleSelectionMode(false); historyPanel.style.display = 'none'; popup.style.display = 'none'; confirmPopup.style.display = 'none'; }
    });

    bubble.oncontextmenu = async (e) => {
        if (!isExtensionEnabled) return;
        e.preventDefault(); 
        currentPanelView = 'history';
        await renderPanelContent();
        historyPanel.style.display = 'flex';
    };

    document.addEventListener('mousedown', (e) => {
        if (isSelectionMode && isEasySelectionEnabled && !shadowHost.contains(e.target)) {
            if (e.button === 0) {
                e.preventDefault(); // Prevent browser from clearing our text selection

                // If popups are open, clicking outside should just dismiss them and reset
                if (easySelectState === 2 || popup.style.display === 'block' || confirmPopup.style.display === 'block') {
                    popup.style.display = 'none';
                    confirmPopup.style.display = 'none';
                    window.getSelection().removeAllRanges();
                    easySelectState = 0;
                    easySelectAnchor = null;
                    return;
                }

                mouseDownPos = {x: e.clientX, y: e.clientY};

                if (easySelectState === 0) {
                    // First click: Lock the anchor!
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        easySelectAnchor = sel.anchorNode;
                        easySelectState = 1;
                        justLocked = true;
                    }
                } else if (easySelectState === 1) {
                    // Second click: Finish selection
                    justLocked = false;
                }
            }
        }

        if (!shadowHost.contains(e.target)) {
            historyPanel.style.display = 'none';
            if (!isSelectionMode) { popup.style.display = 'none'; confirmPopup.style.display = 'none'; }
        }
    });

    document.addEventListener('mouseup', async (e) => {
        if (!isExtensionEnabled) return;
        if (shadowHost.contains(e.target)) return;
        if (!isSelectionMode || isDragging) return;

        if (isEasySelectionEnabled) {
            // Check if user clicked and dragged instead of Click-Move-Click
            const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
            if (dist > 5) {
                justLocked = false; // They dragged, so treat it as finished!
            }

            if (easySelectState === 1 && justLocked) {
                return; // They just locked the start point. Wait for the second click.
            }
            
            if (easySelectState === 1 && !justLocked) {
                easySelectState = 2; // Finished selection state
            }
        }

        const text = window.getSelection().toString().trim();
        const shouldTrigger = !isEasySelectionEnabled || easySelectState === 2;

        if (text.length > 1 && shouldTrigger) {
            const settings = await chrome.storage.local.get('confirmTrigger');
            if (settings.confirmTrigger !== false) {
                pendingRequest = { text, x: e.clientX, y: e.clientY };
                confirmPopup.style.display = 'block'; confirmPopup.style.left = `${Math.min(e.clientX, window.innerWidth - 100)}px`; confirmPopup.style.top = `${e.clientY + 20}px`;
            } else { processText(text, e.clientX, e.clientY); }
        }
    });

    async function syncTheme() {
        const data = await chrome.storage.local.get('theme');
        if (data.theme === 'dark') shadowHost.classList.add('dark'); else shadowHost.classList.remove('dark');
    }
    syncTheme(); checkApiStatus();

    chrome.storage.onChanged.addListener(c => {
        if(c.theme) syncTheme();
        if(c.provider || Object.keys(c).some(k => k.startsWith('key_'))) checkApiStatus();
        if(c.extensionEnabled) updateGlobalState(c.extensionEnabled.newValue);
        if(c.easySelection) isEasySelectionEnabled = c.easySelection.newValue;
    });

    chrome.runtime.onMessage.addListener((m) => {
        if(m.action === "global_state_update") updateGlobalState(m.state);
        if(!isExtensionEnabled) return;
        if(m.action === "toggle_mode") toggleSelectionMode();
        if(m.action === "context_menu_trigger") {
            const selection = window.getSelection(); let x = window.innerWidth / 2 - 150; let y = window.innerHeight / 2 - 100;
            if (selection.rangeCount > 0) { const rect = selection.getRangeAt(0).getBoundingClientRect(); x = rect.left; y = rect.bottom + 10; }
            processText(m.text, x, y);
        }
    });
})();
