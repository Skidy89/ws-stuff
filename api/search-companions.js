import { getSaucePan, sendError } from "../server/saucepan.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const query = req.body?.query?.trim();
  if (!query) return res.status(400).json({ error: "Query is required" });
  try {
    const saucePan = await getSaucePan();
    const companions = await saucePan.companions.searchCompanions({
      asc: true, limit: 10, text_search: query, sus: req.body?.sus ?? true,
      extra_spicy: false, order_by: "popularity", cnf_tags: [], excluded_tags: [],
      hide_hidden_content: false, match_all_fandom_tags: false, offset: 0,
      posted_at_from: null, posted_at_to: null,
    });
    return res.status(200).json(companions);
  } catch (error) {
    return sendError(res, error, "Failed to search companions");
  }
}
