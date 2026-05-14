---

# 🌐 AI AnyWhere Selector

**Select text and ask AI anywhere on the web.**

AI AnyWhere Selector is a lightweight Chrome extension that lets you query AI models directly from any webpage. Highlight text, hit confirm, and get answers in a sleek, "hydrophobic" floating popup.

---

## ✨ Key Features

* **🤖 Multi-Provider:** Support for Gemini, Groq, OpenRouter, SambaNova, Cerebras, Nvidia, and local **Ollama** models.
* **🎯 Smart Selection:** Crosshair mode, Easy-Click selection, and Context Menu (Right-click) integration.
* **💧 Hydrophobic UI:** The response popup intelligently "floats" away from your cursor so it never blocks your view.
* **🧠 Context Aware:** Remembers the last 20 messages for follow-up questions.
* **🔍 Search Grounding:** Real-time web data via Google Gemini.

---

## 🚀 Quick Start

### 1. Installation

1. Download/Clone this repo.
2. Go to `chrome://extensions/` and enable **Developer Mode**.
3. Click **Load unpacked** and select the project folder.

### 2. Configuration

1. Click the extension icon to open **Settings**.
2. Enter your **API Key** and click **Fetch Models**.
3. Customize your **System Prompt** and click **Save**.

### 3. Usage

* **The Bubble:** Drag it anywhere. **Left-click** for selection mode; **Right-click** for history/logs.
* **Selection:** Highlight text → Click ✔ → Get Answer.
* **Hydrophobic Effect:** Move your mouse toward a popup to push it away. Hold `Ctrl/Cmd` to override and hover normally.

---

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | Mac |
| --- | --- | --- |
| **Toggle Selection** | `Alt + W` | `Ctrl + Shift + S` |
| **Enable/Disable Ext.** | `Alt + Shift + X` | `Ctrl + Shift + X` |
| **Close Popups/Exit** | `Escape` | `Escape` |

---

## 🛠️ Supported Providers

| Provider | Type | Default Model |
| --- | --- | --- |
| **Google AI** | Cloud | `gemini-1.5-flash` |
| **Groq** | Cloud | `llama3-8b-8192` |
| **OpenRouter** | Cloud | `mistral-7b-instruct` |
| **Ollama** | Local | `llama3` |
| **Nvidia/Cerebras** | Cloud | `llama3.1` variants |

---

## 📂 Technical Overview

> [!TIP]
> Right-click the floating bubble to access **Error Logs** if an API call fails.

```text
├── manifest.json   # V3 Configuration
├── background.js   # API handling & Context menus
├── content.js      # Injected UI & Hydrophobic logic
├── options.js      # Settings & Model fetching
└── icons/          # Assets

```

---

## 📜 License

MIT License - see [LICENSE](https://www.google.com/search?q=LICENSE) for details.
