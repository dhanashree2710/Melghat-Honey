/* Melghat Honey – Forest Guide
   Live site: Supabase Edge Function (key in Supabase secret only)
   Local PC: optional config.local.js
*/

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const CHAT_PROXY_URL =
  "https://dmehkoxuczhfhnjinniy.supabase.co/functions/v1/chat";
const WHATSAPP = "+91 96995 44383";
const MODEL = "openai/gpt-oss-20b";

function getGroqKey() {
  const key =
    (window.MELGHAT_CONFIG && window.MELGHAT_CONFIG.GROQ_API_KEY) || "";
  if (
    !key ||
    key.includes("YOUR_") ||
    key.includes("PASTE_") ||
    key.length < 20
  )
    return "";
  return key.trim();
}

function getSupabaseAnonKey() {
  if (typeof SUPABASE_ANON_KEY !== "undefined" && SUPABASE_ANON_KEY) {
    return SUPABASE_ANON_KEY;
  }
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZWhrb3h1Y3poZmhuamlubml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzOTk4MDQsImV4cCI6MjEwNTk3NTgwNH0.zhwnWx3i5Mzg0esYBci07jGuvv2wnGRDLzZIaOAbLgc";
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
  toggle.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleChatbot();
    }
  };
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
    addBotMessage(
      "Hello! I'm your Forest Guide. Ask me about our pure Melghat honey, sizes, benefits or bulk orders."
    );
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

async function callChatAPI(messages) {
  // 1) Live server: Supabase Edge Function
  try {
    const res = await fetch(CHAT_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getSupabaseAnonKey(),
        apikey: getSupabaseAnonKey(),
      },
      body: JSON.stringify({ messages: messages }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.choices) return { ok: true, data };
    if (res.status !== 404 && res.status !== 503) {
      return { ok: false, status: res.status, data: data };
    }
  } catch (e) {
    console.warn("Chat proxy unavailable", e);
  }

  // 2) Local only: config.local.js
  const apiKey = getGroqKey();
  if (!apiKey) {
    return { ok: false, status: 0, data: { error: { message: "no_key" } } };
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.6,
      max_tokens: 180,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.choices) return { ok: true, data };
  return { ok: false, status: res.status, data: data };
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;

  addUserMessage(msg);
  input.value = "";
  chatHistory.push({ role: "user", content: msg });

  if (chatHistory.length > 13) {
    chatHistory = [chatHistory[0], ...chatHistory.slice(-12)];
  }

  const typing = document.createElement("div");
  typing.className = "chat-msg bot typing";
  typing.id = "typingInd";
  typing.innerHTML = "<span></span><span></span><span></span>";
  document.getElementById("chatMessages")?.appendChild(typing);

  try {
    const result = await callChatAPI(chatHistory);
    document.getElementById("typingInd")?.remove();

    if (result.ok && result.data.choices && result.data.choices[0]) {
      const reply = result.data.choices[0].message.content || "";
      chatHistory.push({ role: "assistant", content: reply });
      addBotMessage(reply);
      return;
    }

    console.error("Chat error", result.status, result.data);
    chatHistory.pop();

    if (result.data && result.data.error && result.data.error.message === "no_key") {
      addBotMessage(
        "Chat is not ready on the server yet. Contact us on WhatsApp " +
          WHATSAPP +
          "."
      );
    } else if (result.status === 401 || result.status === 403) {
      addBotMessage(
        "API access issue. Please WhatsApp " + WHATSAPP + "."
      );
    } else if (result.status === 429) {
      addBotMessage(
        "Too many requests. Try again in a minute, or WhatsApp " +
          WHATSAPP +
          "."
      );
    } else {
      addBotMessage(
        "Sorry, I'm busy right now. Try WhatsApp " +
          WHATSAPP +
          " for quick help."
      );
    }
  } catch (err) {
    document.getElementById("typingInd")?.remove();
    chatHistory.pop();
    addBotMessage(
      "Connection issue. Reach us on WhatsApp " +
        WHATSAPP +
        " for instant support."
    );
    console.error(err);
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