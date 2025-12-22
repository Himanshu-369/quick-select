# AI AnyWhere Selector (Firefox Extension)

**AI AnyWhere Selector** is a powerful Firefox extension that allows you to seamlessly integrate AI capabilities directly into your browsing experience. Select text on any webpage and instantly ask an AI model to explain, summarize, translate, or analyze it.

Support for **Google Gemini**, **Ollama** (local LLMs), **Groq**, and **OpenRouter** gives you the flexibility to choose the best AI model for your needs.

## Features

*   **Universal Text Selection:** Highlight text on any website to trigger the AI assistant.
*   **Multiple AI Providers:**
    *   **Google Gemini:** Uses the Gemini API (supports Google Search grounding).
    *   **Ollama:** Connect to your locally running LLMs (e.g., Llama 3).
    *   **Groq:** Ultra-fast inference API.
    *   **OpenRouter:** Access to a wide range of top-tier models.
*   **Selection Mode:** A dedicated toggleable mode (Default: `Alt+W`) that turns your cursor into a selector tool for precise interactions.
*   **Context Menu Integration:** Right-click any selected text and choose "Ask AI" to get an immediate response.
*   **Smart Floating Interface:**
    *   **Hydrophobic Popup:** The response window intelligently moves away from your cursor to keep your view unobstructed (hold `Ctrl` to interact/copy).
    *   **Floating Bubble:** A subtle on-screen bubble provides quick access to history and settings.
*   **Chat History:** Keeps a local history of your queries and the AI's responses.
*   **Customizable:**
    *   Dark/Light mode support.
    *   Configurable System Prompts (e.g., "Be concise", "Explain like I'm 5").
    *   Import/Export settings.
*   **Privacy-Focused:** Your API keys and history are stored locally in your browser.

## Installation

1.  **Clone or Download** this repository.
2.  Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3.  Click **"Load Temporary Add-on..."**.
4.  Select the `manifest.json` file from the downloaded directory.

## Configuration

Once installed, click the extension icon in the toolbar or open the Options page to configure your providers:

1.  **Choose a Provider:** Select Google, Groq, OpenRouter, or Ollama.
2.  **Enter API Key:**
    *   **Google:** [Get a Gemini API Key](https://aistudio.google.com/app/apikey)
    *   **Groq:** [Get a Groq API Key](https://console.groq.com/keys)
    *   **OpenRouter:** [Get an OpenRouter Key](https://openrouter.ai/keys)
    *   **Ollama:** Ensure Ollama is running (default: `http://localhost:11434`).
3.  **Fetch Models:** Click "Fetch Models" to load the available models for your chosen provider.
4.  **Select Model:** Choose your preferred model from the dropdown.
5.  **Save Settings:** Click "Save Settings" to apply changes.

## Usage

### 1. Selection Mode
*   Press **`Alt+W`** (Mac: `Ctrl+Shift+S`) or click the floating bubble to toggle **Selection Mode**.
*   Your cursor will change to a crosshair.
*   Select any text on the page.
*   A "Thinking..." popup will appear, followed by the AI's response.

### 2. Context Menu
*   Highlight text normally on any page.
*   Right-click and select **"Ask AI: [Your Text]"**.

### 3. Interacting with the Response
*   **Read:** The response is rendered in Markdown.
*   **Move:** The popup is "hydrophobic" and will move away from your mouse to let you read content behind it.
*   **Interact:** Hold the **`Ctrl`** (or `Meta`/`Command`) key to freeze the popup in place. This allows you to select/copy the text inside the popup.
*   **Close:** Press `Escape` or click outside the popup.

### 4. Chat History
*   **Right-click** the floating bubble icon (bottom-right corner) to open the Chat History panel.
*   View past conversations, copy responses, or clear your history.

### 5. Global Toggle
*   Press **`Alt+Shift+X`** (Mac: `Ctrl+Shift+X`) to instantly enable or disable the extension globally.

## Development

### Project Structure
*   `manifest.json`: Extension configuration and permissions.
*   `background.js`: Handles API calls, context menus, and global state management.
*   `content.js`: Injects the UI (shadow DOM), handles user interactions, and displays responses on webpages.
*   `options.html` / `options.js`: The configuration page for managing settings and keys.

### Local Setup
To modify or contribute:
1.  Make changes to the code.
2.  Go to `about:debugging`.
3.  Click "Reload" on the extension entry to apply changes.

## Privacy & Permissions

*   **Storage:** Saves your preferences and chat history locally.
*   **ActiveTab/Scripting:** Required to inject the popup and read selected text.
*   **Host Permissions:** Needed to communicate with AI API endpoints (Google, Groq, OpenRouter) and Localhost (Ollama).

---
*Note: This is a local extension project. API keys are stored in your browser's local storage and are not shared.*
