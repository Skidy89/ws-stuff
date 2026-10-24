import type Requester from "./requester.js";
import type { Session } from "./session.js";
import { sleep } from "./utils.js";
interface CompanionVibeSearch {
  cnf_tags: string[] | null;
  exclude_favorites: boolean;
  exclude_followed: boolean;
  excluded_tags: string[] | null;
  extra_spicy: boolean;
  fandom_tags: string[];
  include_hidden: boolean;
  match_all_fandoms: boolean;
  only_followed: boolean;
  open_definition_only: boolean;
  prompt: string;
  seed_companion_id: string | null;
  sus: boolean;
}
interface companion {
  id: string;
  author_id: string;
  author_handle: string;
  name: string;
  display_name: string;
  short_description: string;
  tags: string[];
  image: {
    id: string;
  } | null;
  image_crop_zoom: number | null;
  image_crop_x: number | null;
  image_crop_y: number | null;
  sus: boolean;
  very_sus: boolean;
  access_level: string;
  locked_starting_message: boolean;
  interaction_count: number;
  chat_count: number;
  portrait_count: number;
  favorite_count: number;
  scenario_count: number;
  group_count: number;
  lorebook_count: number;
  has_playbook: boolean;
  recipe_count: number;
  is_favorited: boolean;
  posted_at: string;
  updated_at: string;
  card_token_count: number;
  example_dialogue_token_count: number;
  advanced_prompt_token_count: number;
  formatting_instructions_token_count: number;
  fandom_tags: FandomTag[];
  soundcloud_url: string | null;
}
interface FandomTag {
  id: string;
  display_name: string;
}
type orderBy =
  | "trending"
  | "popularity"
  | "created"
  | "updated"
  | "portrait_count"
  | "group_count"
  | "lorebook_count"
  | "scenario_count"
  | "random"
  | "name"
  | "favorited_at";
interface CompanionSearch {
  asc: boolean;
  cnf_tags: string[][];
  excluded_tags: string[];
  extra_spicy: boolean | null;
  hide_hidden_content: boolean;
  limit: number;
  match_all_fandom_tags: boolean;
  offset: number;
  order_by: orderBy;
  posted_at_from: string | null;
  posted_at_to: string | null;
  sus: boolean;
  text_search: string;
}
interface CompanionPayload {
  access_level: "public";

  advanced_prompt: string | null;
  card: string;

  companion_profile_banner_crop_x: number | null;
  companion_profile_banner_crop_y: number | null;
  companion_profile_banner_crop_zoom: number | null;
  companion_profile_banner_image: {
    id: string;
  } | null;
  companion_profile_banner_very_sus: boolean;

  display_name: string;
  example_dialogue: string | null;
  external_model_policy: string;

  fandom_tags: string[];
  formatting_instructions: string | null;
  full_description: string;
  hidden_fields: number;
  hide_on_owner_profile: boolean;

  image: {
    id: string;
  } | null;
  image_crop_x: number | null;
  image_crop_y: number | null;
  image_crop_zoom: number | null;

  locked_starting_message: boolean;
  multiple_scenarios: boolean;
  name: string;
  open_definition: boolean;

  portraits: {
    id: string;
    name: string;
    description: string;
    [key: string]: unknown;
  }[];

  send_notification: boolean;
  short_description: string;
  soundcloud_url: string | null;

  starting_scenarios: {
    id: string | null;
    message: string;
    title: string | null;
    portrait_id: string | null;
    access_level: "public";
  }[];

  suppress_companion_profile_banner: boolean;
  sus: boolean;
  tags: string[];

  temperature_offset_percentage: number;
  unlocked_portraits: boolean;
  very_sus: boolean;
  voice_catalog_id: string | null;
}
interface Companion {
  companion?: {
    id?: string;
    author_id?: string;
    author_handle?: string;
    name?: string;
    display_name?: string;
    full_description?: string;
    short_description?: string;
    tags?: string[];
    image?: {
      id?: string;
    } | null;
    image_crop_zoom?: number | null;
    image_crop_x?: number | null;
    image_crop_y?: number | null;
    sus?: boolean;
    very_sus?: boolean;
    access_level?: string;
    interaction_count?: number;
    chat_count?: number;
    portraits?: {
      id?: string;
      name?: string;
      description?: string;
      very_sus?: boolean;
      image?: {
        id?: string;
      } | null;
      gallery_only?: boolean;
      caption?: string | null;
    }[];
    portrait_count?: number;
    favorite_count?: number;
    group_count?: number;
    lorebook_count?: number;
    has_playbook?: boolean;
    prompt_count?: number;
    scenario_count?: number;
    recipe_count?: number;
    starting_scenarios?: {
      access_level?: string;
      id?: string | null;
      title?: string | null;
      message?: string;
      chat_use_count?: number;
    }[];
    locked_starting_message?: boolean;
    open_definition?: boolean;
    hidden_fields?: number;
    providers_profile?: string;
    unlocked_portraits?: boolean;
    card_token_count?: number;
    example_dialogue_token_count?: number;
    advanced_prompt_token_count?: number;
    formatting_instructions_token_count?: number;
    posted_at?: string;
    updated_at?: string;
    is_favorited?: boolean;
    temperature_offset_percentage?: number;
    score?: number;
    fandom_tags?: {
      id?: string;
      display_name?: string;
    }[];
    hide_on_owner_profile?: boolean;
    preserve_existing_chats?: boolean;
    folder?: string | null;
    folder_hue?: number | null;
    folder_saturation?: number | null;
    soundcloud_url?: string | null;
  };
  did_notify?: boolean;
}

// seriusly tho, who was the genius that made those endpoints so ANNOYING
// i hate this project, i hate this engineer, it would be x100 time easier if they put a ws instead.
// REALLY IM ANNOYED OFF ONLY WRITTING TYPES, SLOW AND STEADY
export default class SauceCompanions {
  timeoutMs = 60_000 * 5;
  pollIntervalMs = 30_000;
  constructor(
    private readonly http: Requester,
    private readonly session: Session,
  ) {}
  // wayyyyyyyyyyy more slow than normal search
  async searchVibeCompanions(
    search: CompanionVibeSearch,
    interval?: number,
    signal?: AbortSignal,
    showsteps = false,
  ): Promise<companion[]> {
    const data = await this.http.request<any>("/api/v2/companion-searches", {
      method: "POST",
      body: {
        cnf_tags: search.cnf_tags,
        exclude_favorites: search.exclude_favorites,
        exclude_followed: search.exclude_followed,
        excluded_tags: search.excluded_tags,
        extra_spicy: search.extra_spicy,
        fandom_tags: search.fandom_tags,
        include_hidden: search.include_hidden,
        match_all_fandoms: search.match_all_fandoms,
        only_followed: search.only_followed,
        open_definition_only: search.open_definition_only,
        prompt: search.prompt,
        seed_companion_id: search.seed_companion_id,
        sus: search.sus,
      },
    });
    const searchId = data.id;
    let status: "waiting" | "running" | "completed" | "insufficient_results" =
      "running";
    let step: string | null = null;
    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      await sleep(interval || this.pollIntervalMs);
      const poll = await this.http.request<any>(
        `/api/v2/companion-searches/${searchId}/poll`,
        { signal },
      );
      status = poll.state.status;
      step = poll.state.step;
      if (showsteps) {
        console.log(`Search status: ${status}, step: ${step}`);
      }
      if (status === "insufficient_results" || status === null) {
        throw new Error("Search failed or returned insufficient results");
      }
      if (status === "completed") {
        const companions: companion[] = [];
        const recommendations = poll.state.recommendations;
        for (const rec of recommendations) {
          companions.push(rec.companion);
        }
        return companions;
      }
    }
    throw new Error("Search timeout");
  }
  async getCompanion(id: string) {
    this.session.getMe();
    return this.http.request<any>(
      `/api/v2/companions/${encodeURIComponent(id)}`,
    );
  }
  async getMyCompanionsChats(offset = 0, limit = 24): Promise<companion[]> {
    this.session.getMe();
    const data = await this.http.request<any>(`/api/v1/chats/companions?filter=all&sort_by=last_message_desc&sort_asc=false&show_nsfw=true&favorites_only=false&chats_per_companion=3&limit=${limit}&offset=${offset}`);
    return data.companions;
  }
  async createCompanion(companion: CompanionPayload) {
    this.session.getMe();
    return this.http.request<Companion>("api/v1/companion", {
      method: "POST",
      body: companion,
    });
  }
  async updateCompanion(id: string, companion: CompanionPayload) {
    this.session.getMe();
    return this.http.request<Companion>(`api/v1/companion/${id}`, {
      method: "PATCH",
      body: companion,
    });
  }
  async deleteCompanion(id: string) {
    this.session.getMe();
    return this.http.request<any>(`api/v1/companion`, {
      method: "DELETE",
      body: { id: id },
    });
  }
  async searchCompanions(search: CompanionSearch): Promise<companion[]> {
    this.session.getMe();
    const payload = {
      asc: search.asc,
      cnf_tags: search.cnf_tags,
      excluded_tags: search.excluded_tags,
      extra_spicy: search.extra_spicy,
      hide_hidden_content: search.hide_hidden_content,
      limit: search.limit,
      match_all_fandom_tags: search.match_all_fandom_tags,
      offset: search.offset,
      order_by: search.order_by,
      posted_at_from: search.posted_at_from,
      posted_at_to: search.posted_at_to,
      sus: search.sus,
      text_search: search.text_search,
    };
    const data = await this.http.request<any>("/api/v1/search", {
      body: payload,
      method: "POST",
    });
    return data.companions;
  }
  async attachLorebookToCompanion(chatId: string, lorebook_ids: string[]) {
    this.session.getMe();
    return this.http.request<any>(`/api/v1/chat-lorebook-relationships/${chatId}`, {
      method: "POST",
      body: { lorebook_ids },
    });
  }
  async lookOutCompanionPortraits(companionIds: string[]) {
    this.session.getMe();
    // todo: add types
    const data = await this.http.request<any>("/api/v1/companions/unlocked-portraits-batch", {
      method: "POST",
      body: { companion_ids: companionIds },
    });
    return data;
  }
  async companionNsfwImages(chatId: string): Promise<string[]> {
    this.session.getMe();
    const data = await this.http.request<any>(`https://saucepan.ai/api/v1/chat/very-sus-images?chat_id=${chatId}`);
    return data.image_ids;
  }
}
