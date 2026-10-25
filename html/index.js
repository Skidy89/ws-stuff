"use strict";

import express from "express";
import "dotenv/config";
import { SaucePan } from "../dist/index.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const app = express();
const saucePan = new SaucePan(process.env.BEARER);
const cachedCompanions = new Map();

app.use(express.json({ limit: "32kb" }));

app.post("/search-companions", async (req, res) => {
  try {
    const sus = req.body.sus ?? false;
    const query = req.body.query?.trim();

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const cacheKey = query.toLowerCase();
    const cached = cachedCompanions.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    const companions = await saucePan.companions.searchCompanions({
      asc: true,
      limit: 10,
      text_search: query,
      sus: sus,
      extra_spicy: false,
      order_by: "popularity",
    });
    console.log(companions);

    cachedCompanions.set(cacheKey, companions);
    res.json(companions);
  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ error: "Failed to search companions" });
  }
});

const chatPayload = new Map();
app.post("/create-chat/:companionId", async (req, res) => {
  try {
    const companionId = req.params.companionId;

    if (!companionId) {
      return res.status(400).json({ error: "Companion ID is required" });
    }

    const [chat, companionData] = await Promise.all([
      saucePan.chats.createChat(companionId),
      saucePan.companions.getCompanion(companionId),
    ]);
    const payload = { chat, companion: companionData.companion };
    chatPayload.set(companionId, payload);

    res.json(payload);
  } catch (error) {
    console.error("Failed to create chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
});
app.get("/retrieve-companion/msg/:companionId", async (req, res) => {
  try {
    const companionId = req.params.companionId;

    if (!companionId) {
      return res.status(400).json({ error: "Companion ID is required" });
    }
    const [chat, companionData] = await Promise.all([
      saucePan.chats.getLatestChat(companionId),
      saucePan.companions.getCompanion(companionId),
    ]);
    const payload = { chat, companion: companionData.companion };
    chatPayload.set(companionId, payload);
    res.json(payload);
  } catch (error) {
    console.error("Failed to retrieve companion:", error);
    res.status(500).json({ error: "Failed to retrieve companion" });
  }
});
app.post("/companion/send-msg/:companionId", async (req, res) => {
  try {
    const companionId = req.params.companionId;
    const message = req.body.message?.trim();

    if (!companionId) {
      return res.status(400).json({ error: "Companion ID is required" });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const chat = req.body.chat ?? chatPayload.get(companionId)?.chat;
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    await saucePan.chats.generateMessage(chat, message, {});
    const data = await saucePan.chats.getLatestChat(companionId);
    const payload = { ...chatPayload.get(companionId), chat: data };
    chatPayload.set(companionId, payload);
    res.json({ chat: data });
  } catch (error) {
    console.error("Failed to send message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});
const chatDir = fileURLToPath(new URL("./chat/", import.meta.url));
const searchDir = fileURLToPath(new URL("./search/", import.meta.url));
app.use("/chat", express.static(chatDir));
app.get("/chat", async (_req, res, next) => {
  try {
    const html = await readFile(path.join(chatDir, "chat.html"), "utf8");

    res.type("html").send(html);
  } catch (error) {
    next(error);
  }
});
app.use(express.static(searchDir));
app.get("/", async (_req, res, next) => {
  try {
    const html = await readFile(path.join(searchDir, "page.html"), "utf8");

    res.type("html").send(html);
  } catch (error) {
    next(error);
  }
});

async function start() {
  try {
    await saucePan.authenticate();

    console.log("Authenticated with SaucePan API");

    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (error) {
    console.error("Failed to authenticate with SaucePan API:", error);
    process.exitCode = 1;
  }
}

start();
