import { AccountMe } from "./me.js";
import SauceChat from "./message.js";
import Requester, { ApiError } from "./requester.js";

const DEFAULT_MODEL = "chat-arita";
type imageData = {
  id: string;
  filesize: number;
  width: number;
  height: number;
  format: string;
};
export interface ImageItems {
  user_id: string;
  name: string;
  folders: string[];
  image: {
    id: string;
  };
  metadata: {
    type: string;
    width: number;
    height: number;
  };
  filesize: number;
  created_at: string;
}

export interface ImageLibrary {
  image_items: ImageItem[];
  total_filesize: number;
  total_count: number;
  average_filesize: number;
}
type ImageItem = {
  id: string;
  user_id: string;
  name: string;
  folders: string[];
  image: {
    id: string;
  };
  metadata: {
    type: string;
    width: number;
    height: number;
  };
  filesize: number;
  created_at: string;
};
interface Persona {
  id?: string;
  additional_images: string[];
  chat_name: string;
  color: string;
  description: string;
  folder: string | null;
  image: {
    id: string;
  };
  lorebook_id: string | null;
  name: string;
  pronouns: string;
  voice_catalog_id: string | null;
}
export interface GenerateOptions {
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

interface PollResponse {
  status: "generating" | "completed";
  result?: { companion_content?: string; companion_portrait?: string };
}

type MessageData = {
  message: string;
  companionPortrait: string;
  chatId: string;
  generationId: string;
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default class SaucePan {
  private readonly http: Requester;
  account: AccountMe = new AccountMe();
  constructor(token: string, http = new Requester(token)) {
    this.http = http;
  }

  async getMe(): Promise<AccountMe> {
    this.account.checkData();
    return this.account;
  }
  async authenticate(): Promise<AccountMe> {
    const data = await this.http.request<any>("/api/v1/users/me");
    this.account.setData(data);
    return this.account;
  }
  async updateMe() {
    await this.authenticate();
  }

  private getCompanion(id: string) {
    this.getMe();
    return this.http.request<any>(
      `/api/v2/companions/${encodeURIComponent(id)}`,
    );
  }

  private async findLatestChatId(companionId: string): Promise<string | null> {
    this.getMe();
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

  async getOrCreateChat(companionId: string, persona?: Persona): Promise<SauceChat> {
    const chatId = await this.findLatestChatId(companionId);
    if (!chatId) return this.startChat(companionId, persona);

    try {
      const state = await this.http.request<any>(
        `/api/v1/core/chat-state?chat_id=${encodeURIComponent(chatId)}`,
      );
      return new SauceChat(state);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404)
        return this.startChat(companionId, persona);
      throw err;
    }
  }
  async createPersona(persona: Persona): Promise<Persona[]> {
    this.getMe();
    if (!persona.image) throw new Error("Persona must have an image");
    if (!persona.name) throw new Error("Persona must have a name");
    if (persona.id) throw new Error("please dont use a id while creating a persona");
    const data = await this.http.request<any>("/api/v1/personas", {
      method: "POST",
      body: {
        personas: [
          {
            name: persona.name,
            description: persona.description,
            image: {
              id: persona.image.id,
            },
            additional_images: persona.additional_images,
            chat_name: persona.chat_name,
            color: persona.color,
            folder: persona.folder,
            lorebook_id: persona.lorebook_id,
            pronouns: persona.pronouns,
            voice_catalog_id: persona.voice_catalog_id,
          },
        ],
      },
    });
    this.updateMe();
    return data.personas[0];
  }

  async startChat(companionId: string, persona?: Persona): Promise<SauceChat> {
    const { companion } = await this.getCompanion(companionId);
    const scenario = companion.starting_scenarios_fragments?.[0];
    if (!scenario)
      throw new Error(`Companion ${companionId} has no starting scenario`);

    const data = await this.http.request<any>("/api/v1/core/create-chat", {
      method: "POST",
      body: {
        chat_name: companion.name,
        companion_id: companionId,
        persona_id: persona?.id!,
        scenario_id: scenario.id,
        metadata: { is_director: false },
      },
    });
    return new SauceChat(data);
  }

  async generateMessage(
    chat: SauceChat,
    content: string,
    opts: GenerateOptions = {},
  ): Promise<MessageData> {
    this.getMe();
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
        active_companion_id: chat.companionIds[0],
        chat_id: chat.id,
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
        const portrait = `https://saucepan.ai/cdn/${poll.result?.companion_portrait}/highres`;
        if (!text) throw new Error("Generation completed without content");
        // TODO: consider using this data instead, it does have more complete stuff like voice clips, etc.
        await this.http.request("/api/v2/chat/commit", {
          method: "POST",
          signal,
          body: { chat_id: chat.id, generation_id },
        });
        return {
          message: text,
          companionPortrait: portrait,
          chatId: chat.id,
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
  async getImageLibrary(): Promise<{ images: ImageLibrary }> {
    this.getMe();
    const request = await this.http.request<any>("/api/v1/image");
    return { images: request };
  }
  async uploadImage(image: string | Blob | File, name: string) {
    this.getMe();
    // this one just generates a presigned URL for uploading an image
    if (typeof image === "string") {
      const res = await fetch(image);
      if (!res.ok) throw new Error(`Failed to fetch image from ${image}`);
      image = await res.blob();
    }
    const data = await this.http.request<{
      upload_url: string;
      upload_attempt_id: string;
    }>("api/v2/images/upload-url", {
      method: "POST",
      body: {
        metadata: null,
      },
    });
    if (!data.upload_url) throw new Error("Failed to get upload URL");
    const uploadUrl = data.upload_url;
    const formData = new FormData();
    formData.append("file", image);
    const res = await this.http.rawRequest<imageData>(uploadUrl, {
      method: "POST",
      body: formData,
    });
    if (!res.id) throw new Error("Failed to upload image");
    const final = await this.http.request<any>(`api/v1/image`, {
      method: "POST",
      body: {
        filesize: res.filesize,
        image_id: res.id,
        name,
        metadata: {
          width: res.width,
          height: res.height,
          type: res.format,
        },
      },
    });
    return final.image_item as ImageItem;
  }
  checkLimits() {
    this.getMe();
    return this.http.request("/api/v1/premium/limits");
  }
}
