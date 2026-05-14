# 🌐 AI AnyWhere Selector

**Select text and ask AI anywhere on the web.**

AI AnyWhere Selector is a powerful, unobtrusive Chrome extension that lets you instantly query AI models directly from any webpage. Simply select text, hit confirm, and get an answer in a sleek, floating popup. It supports multiple cloud providers and local models via Ollama, keeping your workflow uninterrupted.

![Version](https://img.shields.io/badge/version-5.2-blue)
![Manifest](https://img.shields.io/badge/Manifest-V3-green)

---

## ✨ Key Features

- **🤖 Multi-Provider Support:** Connect to Google Gemini, Groq, OpenRouter, SambaNova, Cerebras, Nvidia, or local models via Ollama.
- **🎯 Smart Selection Mode:** Activate crosshair mode to select text on the fly, or use **Easy Selection** (Click to lock start point, move, click to finish).
- **💧 Hydrophobic Popup:** The AI response popup intelligently moves away from your mouse cursor, ensuring it never blocks your reading!
- **🧠 Context Aware:** Maintains chat history (last 20 messages) for follow-up questions, and supports custom System Prompts.
- **🔍 Google Search Grounding:** Enable search grounding for supported Google Gemini models to get real-time web data.
- **🎨 Dark Mode & Markdown:** Beautiful rendering of AI responses with full Markdown support (code blocks, bold, lists) and a theme that matches your vibe.
- **📋 Context Menu Integration:** Right-click any selected text on the web to ask the AI instantly.
- **⚙️ Import/Export Settings:** Easily backup and restore your configuration and API keys.

---

## 🚀 Supported AI Providers

| Provider | Type | Default Model |
| :--- | :--- | :--- |
| **Google AI Studio** | Cloud | `gemini-1.5-flash` |
| **Groq** | Cloud | `llama3-8b-8192` |
| **OpenRouter** | Cloud | `mistralai/mistral-7b-instruct` |
| **SambaNova** | Cloud | `Meta-Llama-3.1-8B-Instruct` |
| **Cerebras** | Cloud | `llama3.1-8b` |
| **Nvidia** | Cloud | `meta/llama3-8b-instruct` |
| **Ollama** | Local | `llama3` |

---

## 🛠️ Installation

Since this isn't published on the Chrome Web Store, you can load it as an unpacked extension:

1. **Clone or Download** this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button in the top left.
5. Select the root folder of this repository (the folder containing `manifest.json`).
6. The extension icon will appear in your browser toolbar!

---

## ⌨️ Keyboard Shortcuts

| Command | Windows/Linux | Mac |
| :--- | :--- | :--- |
| **Toggle Selection Mode** | `Alt + W` | `Ctrl + Shift + S` |
| **Toggle Extension On/Off** | `Alt + Shift + X` | `Ctrl + Shift + X` |
| **Exit Selection/Close Popups** | `Escape` | `Escape` |

---

## 📖 How to Use

### 1. Setup
1. Click the extension icon in your toolbar to open the Settings popup.
2. Select your **Provider** and enter your **API Key** (Not needed for Ollama).
3. Click **Fetch Models** to pull available models from your provider, then select one.
4. Customize your **System Prompt** (e.g., "Be concise and write in bullet points").
5. Click **Save Settings**.

### 2. The Bubble
A small blue bubble will appear in the bottom right of your screen:
- **Left Click:** Toggle Selection Mode.
- **Drag:** Move the bubble to a different position.
- **Right Click:** Open Chat History & Error Logs panel.

### 3. Asking AI
- **Standard Mode:** Click the bubble to enter selection mode (your cursor turns into a crosshair). Highlight text, and a confirm popup (✔/✖) will appear. Click ✔ to ask.
- **Easy Selection Mode:** (Enable in settings). Click once to lock the starting point, move your mouse to expand the selection, and click again to finalize. 
- **Context Menu:** Simply highlight text normally on any page, right-click, and select `Ask AI: "your text"`.

---

## 💡 Advanced Features

### Hydrophobic UI
When reading a long AI response, simply move your mouse towards the popup. It will smoothly "float" away from your cursor, ensuring you can always read the text beneath it without having to close the window. Hold `Ctrl` / `Cmd` to temporarily disable this effect and hover over the popup normally.

### Easy Selection
Perfect for grabbing large blocks of text without clicking and dragging. 
1. Enter selection mode. 
2. Click the start of the text you want. 
3. Move your mouse to the end of the text (it highlights automatically).
4. Click again to capture and send.

### Chat History & Logs
- Right-click the floating bubble to open the History panel.
- Switch between **Chat History** and **Error Logs**.
- Copy messages to clipboard or clear history.
- Error logs provide detailed debugging info if an API call fails.

---

## 📂 Project Structure

```text
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Service worker handling API calls, context menus, and storage
├── content.js          # Injected UI (Bubble, Popup, Easy Selection, Hydrophobic effect)
├── options.html        # Settings UI structure
├── options.js          # Settings logic, model fetching, import/export
└── icons/              # Extension icons (16, 48, 128px)
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
