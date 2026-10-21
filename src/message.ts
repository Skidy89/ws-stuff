export interface Chat {
  advanced_prompt: null;
  advanced_prompt_override: boolean;
  advanced_prompt_prompt_id: string | null;
  advanced_prompt_prompt_title: string | null;
  auto_memory_summaries_enabled: boolean;
  chat_id: string;
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
  user_lorebooks: unknown[];
  voice_settings: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  author: string;
  companionId: string;
  content: string;
  createdAt: string;
  hasVoiceClips: boolean;
  isCanonical: boolean;
  isEdited: boolean;
  isFavorited: boolean;
  portrait: MessagePortrait;
  rating: unknown | null;
  responseGroup: string;
  role: string;
}

export interface MessagePortrait {
  name: string;
  description: string;
  very_sus: boolean | null;
  image: {
    id: string;
  };
  [key: string]: unknown;
}

export interface ChatMetadata {
  is_director: boolean;
  playbook_conditionals_enabled: boolean;
}

export default class SauceMessages {
  constructor(private readonly chat: Chat) {}

  get id(): string {
    return this.chat.chat_id;
  }

  get name(): string {
    return this.chat.chat_name;
  }

  get companionIds(): string[] {
    return this.chat.companion_ids;
  }

  get messages(): ChatMessage[] {
    return this.chat.messages;
  }

  get metadata(): ChatMetadata {
    return this.chat.metadata;
  }

  get isArchived(): boolean {
    return this.chat.is_archived;
  }

  get isOwned(): boolean {
    return this.chat.is_owned;
  }

  get isDirector(): boolean {
    return this.chat.metadata.is_director;
  }

  get autoMemorySummariesEnabled(): boolean {
    return this.chat.auto_memory_summaries_enabled;
  }

  get formattingInstructions(): string | null {
    return this.chat.formatting_instructions;
  }

  get advancedPromptOverride(): boolean {
    return this.chat.advanced_prompt_override;
  }

  get temperatureOffsetPercentageOverride(): number | null {
    return this.chat.temperature_offset_percentage_override;
  }

  get voiceSettings(): Record<string, unknown> {
    return this.chat.voice_settings;
  }
}
