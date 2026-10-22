import sauceCompanions from "./companions.js";
import type { Persona } from "./persona.js";
import type Requester from "./requester.js";
import type { Session } from "./session.js";
import { sleep } from "./utils.js";
interface ChatStartedPayload {
  chat_id: string;
  advanced_prompt: string | null;
  advanced_prompt_override: boolean;
  advanced_prompt_prompt_id: string | null;
  advanced_prompt_prompt_title: string | null;
  auto_memory_summaries_enabled: boolean;
  chat_name: string;
  chat_override_background_image_id: string | null;
  chat_override_portrait_image_id: string | null;
  companion_default_advanced_prompt: string | null;
  companion_default_formatting_instructions: string | null;
  companion_ids: string[];
  folder: string | null;
  formatting_instructions: string | null;
  is_archived: boolean;
  is_owned: boolean;
  last_auto_memory_cursor_at: string | null;
  messages: ChatMessage[];
  metadata: ChatMetadata;
  temperature_offset_percentage_override: number | null;
  user_lorebooks: UserLorebook[];
  voice_settings: VoiceSettings;
}

interface ChatMessage {
  id: string;
  author: string;
  companionId: string | null;
  content: string;
  createdAt: string;
  hasVoiceClips: boolean;
  isCanonical: boolean;
  isEdited: boolean;
  isFavorited: boolean;
  portrait: string | null;
  rating: number | null;
  responseGroup: string;
  role: string;
}

interface ChatMetadata {
  is_director: boolean;
  playbook_conditionals_enabled: boolean;
}

interface UserLorebook {
  [key: string]: unknown;
}

interface VoiceSettings {
  slots: VoiceSlot[];
  version: number;
  initialized: boolean;
}

interface VoiceSlot {
  id: string;
  label: string;
  autoselect: boolean;
  slot_type: VoiceSlotType;
  speech_parts?: string[];
  speech_parts_unified?: boolean;
  voice_catalog_id?: string | null;
}
interface PollResponse {
  status: "generating" | "completed";
  result?: { companion_content?: string; companion_portrait?: string };
}

type VoiceSlotType =
  | {
      type: "companion";
      companion_id: string;
    }
  | {
      type: "user";
    }
  | {
      type: "narrator";
    };
type simpleResponseInstructions = {
  dialogue: "dialogue" | "balanced" | "narration";
  intimacy: "smut" | "sexual" | "romantic" | "platonic";
  /** this would slow response times */
  length: "short" | "ramble" | "essay";
  pacing: "slow" | "fast";
  pov: "text_messaging";
  speakFor: "companion" | "both";
};
interface GenerateOptions {
  modelAlias?: string;
  utcOffsetMinutes?: number;
  promotedMessageId?: string | null;
  pollIntervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  simpleResponseInstructions?: simpleResponseInstructions;
  /** custom instructions for the llm */
  responseDescription?: string;
}
interface startChatOptions {
  persona?: Persona;
  scenario?: number;
}
type MessageData = {
  message: string;
  companionPortrait: string;
  chatId: string;
  generationId: string;
};

const DEFAULT_MODEL = "chat-arita";
export default class sauceChat {
  constructor(
    private readonly http: Requester,
    private readonly session: Session,
    private readonly companions: sauceCompanions,
  ) {}
  private async findLatestChatId(companionId: string): Promise<string | null> {
    this.session.getMe();
    const qs = new URLSearchParams({
      companion_id: companionId,
      limit: "1",
      offset: "0",
    });
    const data = await this.http.request<{ chats?: { id: string }[] }>(
      `/api/v1/chats/by-companion?${qs}`,
    );
    return data.chats?.[0]?.id ?? null;
  }
  async createChat(companionId: string): Promise<ChatStartedPayload> {
    const data = await this.startChat(companionId);
    const chatId = data.chat_id;
    if (!chatId) {
      throw new Error("Failed to create chat");
    }
    const state = await this.http.request<any>(
      `/api/v1/core/chat-state?chat_id=${encodeURIComponent(chatId)}`,
    );
    return state as ChatStartedPayload;
  }
  async getLatestChat(companionId: string): Promise<ChatStartedPayload> {
    const chatId = await this.findLatestChatId(companionId);
    if (!chatId) {
      throw new Error("No chat found for companion");
    }
    const state = await this.http.request<any>(
      `/api/v1/core/chat-state?chat_id=${encodeURIComponent(chatId)}`,
    );
    return state as ChatStartedPayload;
  }

  async startChat(
    companionId: string,
    opts?: startChatOptions,
  ): Promise<ChatStartedPayload> {
    const { companion } = await this.companions.getCompanion(companionId);
    const scenario = companion.starting_scenarios_fragments?.[0];
    if (!scenario)
      throw new Error(`Companion ${companionId} has no starting scenario`);

    const data = await this.http.request<any>("/api/v1/core/create-chat", {
      method: "POST",
      body: {
        chat_name: companion.name,
        companion_id: companionId,
        persona_id: opts?.persona?.id!,
        scenario_id: scenario.id,
        metadata: { is_director: false },
      },
    });
    if (data.message !== "Chat created successfully") {
      throw new Error(`Failed to create chat: ${data.message}`);
    }
    return data;
  }
  async generateMessage(
    chat: ChatStartedPayload,
    content: string,
    opts: GenerateOptions = {},
  ): Promise<MessageData> {
    this.session.getMe();
    const {
      modelAlias = DEFAULT_MODEL,
      utcOffsetMinutes = -new Date().getTimezoneOffset(),
      promotedMessageId = null,
      pollIntervalMs = 5_000,
      timeoutMs = 120_000,
      signal,
    } = opts;

    const { generation_id } = await this.http.request<{
      generation_id: string;
    }>("/api/v2/chat/generate", {
      method: "POST",
      signal,
      body: {
        active_companion_id: chat.companion_ids[0],
        chat_id: chat.chat_id,
        content,
        generation_config: { saucepan: { model_alias: modelAlias } },
        mode: "user",
        playbook_enabled: chat.metadata.playbook_conditionals_enabled,
        promoted_message_id: promotedMessageId,
        utc_offset_minutes: utcOffsetMinutes,
        // custom llm instructions
        response_description: opts.responseDescription,
        simple_response_instructions: opts.simpleResponseInstructions,
      },
    });

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await sleep(pollIntervalMs);
      const poll = await this.http.request<PollResponse>(
        `/api/v2/chat/generation/${generation_id}/poll`,
        { signal },
      );

      if (poll.status === "completed") {
        const text = poll.result?.companion_content;
        const portrait = poll.result?.companion_portrait;
        if (!text) throw new Error("Generation completed without content");
        // TODO: consider using this data instead, it does have more complete stuff like voice clips, etc.
        await this.http.request("/api/v2/chat/commit", {
          method: "POST",
          signal,
          body: { chat_id: chat.chat_id, generation_id },
        });
        return {
          message: text,
          companionPortrait: portrait!,
          chatId: chat.chat_id,
          generationId: generation_id,
        };
      }
      if (poll.status !== "generating") {
        throw new Error(`Generation ended with status "${poll.status}"`);
      }
    }
    throw new Error(
      `Generation ${generation_id} timed out after ${timeoutMs}ms`,
    );
  }
}
