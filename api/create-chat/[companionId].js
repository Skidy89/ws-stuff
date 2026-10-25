import { getSaucePan, sendError } from "../../server/saucepan.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const companionId = req.query.companionId;
  if (!companionId) return res.status(400).json({ error: "Companion ID is required" });
  try {
    const saucePan = await getSaucePan();
    const [chat, result] = await Promise.all([
      saucePan.chats.createChat(companionId),
      saucePan.companions.getCompanion(companionId),
    ]);
    return res.status(200).json({ chat, companion: result.companion });
  } catch (error) {
    return sendError(res, error, "Failed to create chat");
  }
}
