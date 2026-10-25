import { getSaucePan, sendError } from "../../../server/saucepan.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const companionId = req.query.companionId;
  const message = req.body?.message?.trim();
  const chat = req.body?.chat;
  if (!companionId || !message || !chat?.chat_id || !Array.isArray(chat.companion_ids)) {
    return res.status(400).json({ error: "Companion ID, message, and chat are required" });
  }
  try {
    const saucePan = await getSaucePan();
    await saucePan.chats.generateMessage(chat, message, {});
    const updatedChat = await saucePan.chats.getLatestChat(companionId);
    return res.status(200).json({ chat: updatedChat });
  } catch (error) {
    return sendError(res, error, "Failed to send message");
  }
}
