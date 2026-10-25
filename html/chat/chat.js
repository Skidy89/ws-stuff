"use strict";

const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const messagesContainer = document.querySelector("#messages");
const params = new URLSearchParams(window.location.search);
const companionId = decodeURIComponent(
  window.location.pathname.split("/").filter(Boolean).at(-1) ||
    params.get("companionId") ||
    "",
);
const profile = document.querySelector("#chat-profile");
const profileImage = document.querySelector("#companion-avatar");
const profileName = document.querySelector("#companion-name");
const profileDescription = document.querySelector("#companion-description");
let chatData = null;

function imageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `https://saucepan.ai/cdn/${encodeURIComponent(image)}/highres`;
}

function showProfile(companion) {
  if (!companion) return;
  profileName.textContent =
    companion.display_name || companion.name || "Companion";
  profileDescription.textContent = companion.short_description || "";
  const url = imageUrl(companion.image?.id || companion.image);
  if (url) {
    profileImage.src = url;
    profileImage.hidden = false;
  } else {
    profileImage.hidden = true;
  }
  profile.hidden = false;
}

function appendMessage(message, companion) {
  const isUser = message.role === "user";
  const container = document.createElement("article");
  container.className = `container${isUser ? " darker" : ""}`;

  const heading = document.createElement("div");
  heading.className = "message-heading";
  const avatar = document.createElement("img");
  avatar.className = "message-avatar";
  avatar.alt = "";
  const portrait =
    imageUrl(message.portrait) ||
    (!isUser
      ? imageUrl(companion?.image)
      : "https://avatars.githubusercontent.com/u/112231743?s=96&v=4");
  if (portrait) avatar.src = portrait;
  else avatar.hidden = true;
  const author = document.createElement("strong");
  author.textContent = isUser
    ? message.author || "You"
    : companion?.display_name ||
      companion?.name ||
      message.author ||
      "Companion";
  heading.append(avatar, author);

  const paragraph = document.createElement("p");
  paragraph.className = "message-content";
  paragraph.textContent = message.content || "";

  const time = document.createElement("span");
  time.className = isUser ? "time-left" : "time-right";
  time.textContent = new Date(
    message.createdAt ?? Date.now(),
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  container.append(heading, paragraph, time);
  messagesContainer.append(container);
  container.scrollIntoView({ behavior: "smooth", block: "end" });
}

async function loadChat() {
  if (!companionId) throw new Error("Missing companion ID in URL");
  if (!chatData) {
    const cached = sessionStorage.getItem(`chat:${companionId}`);
    if (cached) {
      try {
        chatData = JSON.parse(cached);
      } catch {
        sessionStorage.removeItem(`chat:${companionId}`);
      }
    }
  }
  if (!chatData?.chat || !chatData?.companion) {
    const response = await fetch(
      `/api/retrieve-companion/msg/${encodeURIComponent(companionId)}`,
    );
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Failed to retrieve chat");
    chatData = body;
    sessionStorage.setItem(`chat:${companionId}`, JSON.stringify(chatData));
  }
  showProfile(chatData.companion);
  messagesContainer.replaceChildren();
  for (const message of chatData.chat.messages || [])
    appendMessage(message, chatData.companion);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = input.value.trim();
  if (!content || !companionId) return;
  input.disabled = true;
  const indicator = document.querySelector("#typingIndicator");
  try {
    input.value = "";
    indicator.style.display = "flex";
    const response = await fetch(
      `/api/companion/send-msg/${encodeURIComponent(companionId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, chat: chatData?.chat }),
      },
    );
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Failed to send message");
    chatData.chat = body.chat;
    sessionStorage.setItem(`chat:${companionId}`, JSON.stringify(chatData));
    await loadChat();
  } catch (error) {
    console.error("Chat error:", error);
    indicator.querySelector("span").textContent =
      error.message || "Message failed";
  } finally {
    indicator.querySelector("span").textContent = "Companion is typing...";
    indicator.style.display = "none";
    input.disabled = false;
    input.focus();
  }
});

const indicator = document.querySelector("#typingIndicator");
loadChat().catch((error) => {
  console.error(error);
  document.querySelector("#messages").textContent =
    error.message || "Unable to load this chat.";
});
