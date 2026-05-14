---

#  AI AnyWhere Selector

**Select text and ask AI anywhere on the web.**

AI AnyWhere Selector is a powerful, unobtrusive Chrome extension that lets you instantly query AI models directly from any webpage. Simply select text, hit confirm, and get an answer in a sleek, floating popup.

---

## ✨ Key Features

* **🤖 Multi-Provider:** Support for Gemini, Groq, OpenRouter, SambaNova, Cerebras, Nvidia, and local **Ollama** models.
* **🎯 Smart Selection:** Crosshair mode, Easy-Click selection, and Context Menu integration.
* **💧 Hydrophobic UI:** The response popup intelligently moves away from your cursor to ensure it never blocks your reading.
* **🧠 Context Aware:** Maintains chat history (last 20 messages) and supports custom System Prompts.
* **🔍 Search Grounding:** Enable search grounding for supported Gemini models to get real-time web data.
* **🎨 Dark Mode & Markdown:** Beautiful rendering of code blocks, bold text, and lists.
* **⚙️ Data Portability:** Easily **Import/Export** settings and API keys for backup.

---

## 🛠️ Installation & Setup

### 1. Installation

Since this is a developer tool, load it as an unpacked extension:

1. **Clone/Download** this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the repository root folder.

### 2. Configuration

1. Click the extension icon in your toolbar to open **Settings**.
2. Select your **Provider** and enter your **API Key** (not required for Ollama).
3. Click **Fetch Models** to pull available options, then select your preferred model.
4. Click **Save Settings**.

---

## 📖 How to Use

### The Floating Bubble

* **Left Click:** Toggle Selection Mode.
* **Right Click:** Open Chat History & Error Logs.
* **Drag:** Move the bubble to any position on your screen.

### Asking the AI

* **Standard Mode:** Click the bubble to turn your cursor into a crosshair. Highlight text and click **✔** to ask.
* **Easy Selection Mode:** (Enable in settings). Click once to lock the start point, move your mouse to highlight, and click again to finalize.
* **Context Menu:** Right-click any highlighted text on a page and select `Ask AI`.

### Advanced UI Interactions

* **Hydrophobic Effect:** Move your mouse toward a popup to "push" it away.
* **Hover Override:** Hold **Ctrl** (Windows) or **Cmd** (Mac) to temporarily disable the movement and hover over the popup normally.

---

## ⌨️ Keyboard Shortcuts

| Command | Windows/Linux | Mac |
| --- | --- | --- |
| **Toggle Selection Mode** | `Alt + W` | `Ctrl + Shift + S` |
| **Toggle Extension On/Off** | `Alt + Shift + X` | `Ctrl + Shift + X` |
| **Exit / Close Popups** | `Escape` | `Escape` |

---

## 🚀 Supported Providers

| Provider | Type | Default Model |
| --- | --- | --- |
| **Google AI Studio** | Cloud | `gemini-1.5-flash` |
| **Groq** | Cloud | `llama3-8b-8192` |
| **OpenRouter** | Cloud | `mistral-7b-instruct` |
| **Ollama** | Local | `llama3` |
| **SambaNova/Cerebras** | Cloud | `llama3.1` variants |

---

## 📂 Project Structure

```text
├── manifest.json       # Extension configuration (V3)
├── background.js       # API calls, context menus, and storage
├── content.js          # Injected UI (Bubble, Popups, Hydrophobic effect)
├── options.html/js     # Settings UI and model fetching logic
└── icons/              # Extension assets

```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

---

**Is there a specific section you'd like to emphasize even more, or does this cover the full feature set now?**
