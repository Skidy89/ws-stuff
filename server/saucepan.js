import { SaucePan } from "../src/index.ts";

export async function getSaucePan() {
  const token = process.env.BEARER;
  if (!token) throw new Error("The BEARER environment variable is not configured.");
  const saucePan = new SaucePan(token);
  await saucePan.authenticate();
  return saucePan;
}

export function sendError(res, error, message) {
  console.error(message, error);
  res.status(500).json({ error: message });
}
