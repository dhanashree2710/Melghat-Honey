/* Melghat Honey – Forest Guide (Chat Assistant)
   Short, simple answers. Same on every page. Bee icon with animation.
   API key comes from js/config.local.js (gitignored — never push this key). */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const WHATSAPP = "+91 96995 44383";

function getGroqKey() {
  const key = (window.MELGHAT_CONFIG && window.MELGHAT_CONFIG.GROQ_API_KEY) || "";
  if (!key || key.includes("YOUR_GROQ") || key.length < 20) return "";
  return key.trim();
}

const systemPrompt = `You are the Forest Guide for Melghat Honey – a friendly helper on the Melghat Honey website.
Brand: Pure raw forest honey from Melghat Tiger Reserve, Maharashtra. Harvested by tribal (Korku) communities. 100% natural, no chemicals, lab tested.
Products: Forest / Multifloral, Acacia, Lychee, Coriander, Wildflower, Neem, Longan honeys. Sizes typically 250g, 500g, 1kg. Prices from about ₹299.
Help with: products, benefits, how to use, bulk orders, shipping, story of Melghat.
Rules:
- Keep every answer short and simple (max 2–3 short sentences).
- Warm, natural tone. No long paragraphs.
- Never invent medical claims. Suggest doctor for health questions.
- For orders / bulk: guide to Shop page or WhatsApp ${WHATSAPP}.
- Current year 2026.`;

let chatHistory = [{ role: "system", content: systemPrompt }];

function ensureChatbotDOM() {
  if (document.getElementById("chatbotWindow")) return;

  document.querySelector(".chatbot-toggle")?.remove();
  document.querySelector(".honey-guide-toggle")?.remove();

  const toggle = document.createElement("div");
  toggle.className = "honey-guide-toggle";
  toggle.id = "honeyGuideToggle";
  toggle.title = "Ask Forest Guide";
  toggle.setAttribute("role", "button");
  toggle.setAttribute("tabindex", "0");
  toggle.innerHTML = `
    <div class="bee-icon">
      <svg viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">
        <ellipse cx="32" cy="36" rx="14" ry="16" fill="#F4B400"/>
        <ellipse cx="32" cy="36" rx="10" ry="12" fill="#3E2723"/>
        <path d="M22 28 Q18 20 24 16" fill="#E3F2FD" stroke="#90CAF9" stroke-width="1.5"/>
        <path d="M42 28 Q46 20 40 16" fill="#E3F2FD" stroke="#90CAF9" stroke-width="1.5"/>
        <circle cx="26" cy="32" r="2.5" fill="#fff"/>
        <circle cx="38" cy="32" r="2.5" fill="#fff"/>
        <circle cx="26.5" cy="32.5" r="1" fill="#222"/>
        <circle cx="38.5" cy="32.5" r="1" fill="#222"/>
        <path d="M28 42 Q32 46 36 42" stroke="#F4B400" stroke-width="1.5" fill="none"/>
        <line x1="32" y1="20" x2="32" y2="12" stroke="#3E2723" stroke-width="2"/>
        <circle cx="32" cy="10" r="3" fill="#F4B400"/>
      </svg>
    </div>
    <span class="pulse-ring"></span>
  `;
  toggle.onclick = toggleChatbot;
  toggle.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleChatbot(); } };
  document.body.appendChild(toggle);

  const win = document.createElement("div");
  win.className = "honey-guide-window";
  win.id = "chatbotWindow";
  win.innerHTML = `
    <div class="honey-guide-header">
      <div class="d-flex align-items-center gap-2">
        <div class="header-bee">🐝</div>
        <div>
          <strong>Forest Guide</strong>
          <div class="small opacity-75">Melghat Honey Helper</div>
        </div>
      </div>
      <button type="button" class="btn-close-guide" onclick="toggleChatbot()" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="honey-guide-messages" id="chatMessages"></div>
    <div class="honey-guide-input">
      <input type="text" id="chatInput" placeholder="Ask about our honey..." autocomplete="off">
      <button type="button" onclick="sendChatMessage()" title="Send">
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  `;
  document.body.appendChild(win);
}

function toggleChatbot() {
  ensureChatbotDOM();
  const win = document.getElementById("chatbotWindow");
  const toggle = document.getElementById("honeyGuideToggle");
  win.classList.toggle("open");
  if (toggle) toggle.classList.toggle("open");

  if (win.classList.contains("open") && chatHistory.length === 1) {
    const hasKey = !!getGroqKey();
    if (hasKey) {
      addBotMessage("Hello! I’m your Forest Guide. Ask me about our pure Melghat honey, sizes, benefits or bulk orders.");
    } else {
      addBotMessage("Hello! Chat needs a local API key to reply. For now, message us on WhatsApp " + WHATSAPP + " — or add js/config.local.js on this device.");
    }
  }
  if (win.classList.contains("open")) {
    setTimeout(() => document.getElementById("chatInput")?.focus(), 300);
  }
}

function addBotMessage(text) {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "chat-msg bot";
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addUserMessage(text) {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const div = document.createElement("div");
  div.className = "chat-msg user";
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;

  const apiKey = getGroqKey();
  if (!apiKey) {
    addUserMessage(msg);
    input.value = "";
    addBotMessage("Chat is not configured on this device (missing local key). Contact us on WhatsApp " + WHATSAPP + ".");
    return;
  }

  addUserMessage(msg);
  input.value = "";
  chatHistory.push({ role: "user", content: msg });

  // Keep history short so requests stay small
  if (chatHistory.length > 13) {
    chatHistory = [chatHistory[0], ...chatHistory.slice(-12)];
  }

  const typing = document.createElement("div");
  typing.className = "chat-msg bot typing";
  typing.id = "typingInd";
  typing.innerHTML = "<span></span><span></span><span></span>";
  document.getElementById("chatMessages")?.appendChild(typing);

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
       model: "openai/gpt-oss-20b",
        messages: chatHistory,
        temperature: 0.6,
        max_tokens: 180
      })
    });

    const data = await res.json().catch(() => ({}));
    document.getElementById("typingInd")?.remove();

    if (!res.ok) {
      console.error("Groq error", res.status, data);
      const errMsg = (data && data.error && data.error.message) || ("HTTP " + res.status);
      if (res.status === 401 || res.status === 403) {
        addBotMessage("API key invalid or expired. Update js/config.local.js, or WhatsApp us at " + WHATSAPP + ".");
      } else if (res.status === 429) {
        addBotMessage("Too many requests right now. Try again in a minute, or WhatsApp " + WHATSAPP + ".");
      } else {
        addBotMessage("Sorry, I’m busy right now. Try WhatsApp " + WHATSAPP + " for quick help.");
      }
      chatHistory.pop(); // remove failed user turn so history stays clean
      return;
    }

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const reply = data.choices[0].message.content || "";
      chatHistory.push({ role: "assistant", content: reply });
      addBotMessage(reply);
    } else {
      addBotMessage("Sorry, I’m busy right now. Try WhatsApp " + WHATSAPP + " for quick help.");
      chatHistory.pop();
    }
  } catch (err) {
    document.getElementById("typingInd")?.remove();
    addBotMessage("Connection issue. Reach us on WhatsApp " + WHATSAPP + " for instant support.");
    console.error(err);
    chatHistory.pop();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ensureChatbotDOM();
  const input = document.getElementById("chatInput");
  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendChatMessage();
    });
  }
});
