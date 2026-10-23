import type Requester from "./requester.js";
import type { Session } from "./session.js";
interface community {
  posts?: {
    items?: {
      id?: string;
      title?: string;
      blurb?: string;
      image_id?: string | null;
      slug?: string;
      author_id?: string;
      author_handle?: string;
      access_level?: string;
      posted_at?: string;
      updated_at?: string;
      tags?: string[];
      content_warning_tags?: string[];
      is_community?: boolean;
      favorite_count?: number;
      comment_count?: number;
      is_favorited?: boolean;
      very_nsfw?: boolean;
      poll?: unknown | null;
      is_quiz?: boolean;
      prompt_count?: number;
      template_count?: number;
      hide_on_owner_profile?: boolean;
      table_of_contents_level?: number;
      folder?: string | null;
      folder_hue?: number | null;
      folder_saturation?: number | null;
    }[];
  };
}
interface CommunityPayload {
  limit: number;
  offset: number;
  poll_filter: "all" | "following" | "my_posts";
  prompt_filter: "all" | "following" | "my_prompts";
  tags: string[] | null;
}

interface Poll {
  options?: {
    id?: string;
    emoji?: string;
    text?: string;
    vote_count?: number;
    is_user_vote?: boolean;
    is_correct?: boolean;
  }[];
  user_votes?: string[];
  eligible?: boolean;
  hide_results_until_closed?: boolean;
  can_retract?: boolean;
  old_accounts_only?: boolean;
  max_selections?: number;
  is_quiz?: boolean;
  reveal_correct?: boolean;
  total_votes?: number;
}
export interface Posts {
  post?: {
    id?: string;
    title?: string;
    slug?: string;
    blurb?: string;
    content?: string;
    access_level?: string;
    author_id?: string;
    author_handle?: string;
    image_id?: string | null;
    content_warning_tags?: string[];
    created_at?: string;
    posted_at?: string;
    updated_at?: string;
    favorite_count?: number;
    has_been_public?: boolean;
    has_shares?: boolean;
    hide_on_owner_profile?: boolean;
    is_community?: boolean;
    is_favorited?: boolean;
    poll?: {
      question?: string;
      duration_in_days?: number;
      has_votes?: boolean;
      can_retract?: boolean;
      hide_results_until_closed?: boolean;
      old_accounts_only?: boolean;
      options?: {
        id?: string;
        emoji?: string | null;
        text?: string;
        vote_count?: number;
        is_user_vote?: boolean;
        is_correct?: boolean;
      }[];
      poll_force_closed_at?: string | null;
    } | null;
    table_of_contents_level?: number;
    tags?: string[];
    very_nsfw?: boolean;
  };
}
export default class SauceCommunity {
  constructor(
    private readonly http: Requester,
    private readonly session: Session,
  ) {}
  async searchCommunity(payload: CommunityPayload): Promise<community> {
    this.session.getMe();
    const data = await this.http.request<community>("api/v1/posts/community", {
      method: "POST",
      body: {
        limit: payload.limit,
        offset: payload.offset,
        poll_filter: payload.poll_filter,
        prompt_filter: payload.prompt_filter,
        tags: payload.tags,
      },
    });
    return data;
  }
  async checkResultsForPoll(pollId: string): Promise<Poll> {
    this.session.getMe();
    const data = await this.http.request<Poll>(
      `api/v2/posts/${encodeURIComponent(pollId)}/poll/results`,
    );
    return data;
  }
  async voteOnPoll(pollId: string, optionIds: string[]): Promise<boolean> {
    this.session.getMe();
    const data = await this.http.request<{ success?: boolean }>(
      `api/v2/posts/${encodeURIComponent(pollId)}/poll/results`,
      {
        method: "POST",
        body: {
          option_ids: [...optionIds],
        },
      },
    );
    return data.success ?? false;
  }
  async checkPost(author_handle: string, blurb: string): Promise<Posts> {
    this.session.getMe();
    const slug = blurb.toLowerCase().trim().replace(/\s+/g, "-");
    const data = await this.http.request<Posts>(
      `/api/v1/posts/${encodeURIComponent(author_handle)}/${encodeURIComponent(slug)}`,
    );
    return data;
  }
  async commentOnPost(postId: string, comment: string): Promise<boolean> {
    this.session.getMe();
    const data = await this.http.request<{ approved?: boolean }>(
      `api/v1/comments`,
      {
        method: "POST",
        body: {
          entity_id: postId,
          content: comment,
          entity_type: "post",
        },
      },
    );
    return data.approved ?? false;
  }
}
