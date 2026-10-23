import type Requester from "./requester.js";
import type { Session } from "./session.js";

interface LorebookPayload {
  access_level: "private" | "public";
  content: {
    title: string;
    text: string;
  }[];
  definition_protection: "open" | string;
  fandom_tags: string[];
  hide_on_owner_profile: boolean;
  image_crop_x: number | null;
  image_crop_y: number | null;
  image_crop_zoom: number | null;
  image_id: string;
  name: string;
  nsfw: boolean;
  send_notification: boolean;
  short_description: string;
  table_of_contents_level: number;
  tags: string[];
  very_nsfw: boolean;
}
interface LorebookResponse {
  lorebook?: {
    id?: string;
    name?: string;
    content?: {
      id?: string;
      title?: string;
      text?: string;
    }[];
    owner_id?: string;
    owner_handle?: string | null;
    access_level?: string;
    short_description?: string;
    nsfw?: boolean;
    very_nsfw?: boolean;
    image_id?: string;
    image_crop_zoom?: number | null;
    image_crop_x?: number | null;
    image_crop_y?: number | null;
    tags?: string[];
    chapter_count?: number;
    total_word_count?: number;
    favorite_count?: number;
    is_favorited?: boolean;
    has_been_public?: boolean;
    collaboration_type?: string;
    posted_at?: string;
    updated_at?: string;
    hide_on_owner_profile?: boolean;
    definition_protection?: string;
    table_of_contents_level?: number;
  };
  did_notify?: boolean;
}
export default class SauceLorebook {
  constructor(
    private readonly http: Requester,
    private readonly session: Session,
  ) {}
  async uploadLorebook(lorebook: LorebookPayload) {
    this.session.getMe();
    if (!lorebook) throw new Error("Lorebook payload is required");
    const request = await this.http.request<LorebookResponse>(
      "/api/v1/lorebooks",
      {
        method: "POST",
        body: lorebook,
      },
    );
    return request;
  }
  async deleteLorebook(lorebookId: string) {
    this.session.getMe();
    if (!lorebookId) throw new Error("Lorebook ID is required");
    const request = await this.http.request(`/api/v1/lorebooks/${lorebookId}`, {
      method: "DELETE",
    });
    return request;
  }
  async updateLorebook(lorebookId: string, lorebook?: LorebookPayload) {
    this.session.getMe();
    if (!lorebook) throw new Error("Lorebook payload is required");
    const request = await this.http.request<LorebookResponse>(
      `/api/v1/lorebooks/${lorebookId}`,
      {
        method: "PATCH",
        body: lorebook,
      },
    );
    return request;
  }
}
