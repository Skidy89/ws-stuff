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
export default class sauceCompanions {
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
    let status: "running" | "completed" | "insufficient_results" = "running";
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
      if (
        step === undefined ||
        step === null ||
        status === "insufficient_results"
      ) {
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
}
