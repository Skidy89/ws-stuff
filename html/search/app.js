"use strict";

const form = document.querySelector("#searchForm");
const queryInput = document.querySelector("#query");
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const template = document.querySelector("#companionTemplate");

async function searchCompanions(query) {
  const response = await fetch("/api/search-companions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, sus: true }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Search failed");
  }

  if (!Array.isArray(data)) {
    throw new Error("Invalid response from server");
  }

  return data;
}

function renderCompanion(companion) {
  const fragment = template.content.cloneNode(true);
  const article = fragment.querySelector(".companion");

  article
    .querySelector(".start-chat")
    .addEventListener("click", async (event) => {
      const button = event.currentTarget;

      try {
        button.disabled = true;

        const response = await fetch(
          `/api/create-chat/${encodeURIComponent(companion.id)}`,
          {
            method: "POST",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to create chat");
        }

        const payload = await response.json();
        sessionStorage.setItem(`chat:${companion.id}`, JSON.stringify(payload));
        window.location.href = `/chat/${encodeURIComponent(companion.id)}`;
      } catch (error) {
        console.error("Error creating chat:", error);
        button.disabled = false;
      }
    });

  article.querySelector(".name").textContent =
    companion.display_name ?? "Unnamed companion";

  article.querySelector(".description").textContent =
    companion.short_description ?? "No description available.";

  article.querySelector(".author").textContent =
    `By: @${companion.author_handle ?? "unknown"}`;

  const image = article.querySelector(".portrait");
  const imageId = companion.image?.id;

  if (imageId) {
    image.src = `https://saucepan.ai/cdn/${encodeURIComponent(imageId)}/highres`;
    image.classList.toggle("sus", Boolean(companion.sus));
  } else {
    image.hidden = true;
  }

  return fragment;
}

function renderResults(companions) {
  const fragment = document.createDocumentFragment();

  for (const companion of companions) {
    fragment.appendChild(renderCompanion(companion));
  }

  results.replaceChildren(fragment);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = queryInput.value.trim();
  if (!query) return;

  status.textContent = "Searching...";
  results.replaceChildren();

  try {
    const companions = await searchCompanions(query);

    renderResults(companions);

    status.textContent = companions.length
      ? `${companions.length} results`
      : "No companions found.";
  } catch (error) {
    status.textContent = error.message;
  }
});
