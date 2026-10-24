import type Requester from "./requester.js";
import type { Session } from "./session.js";

interface PlaybookPayload {
  name: string;
  description: string;
  short_description: string;
  user_instructions: string;
  fallback_user_instructions: string;
  access_level: "public";
  collaboration_type: "public";
  definition?: PlaybookDefinition;
  lorebook_ids: string[];
  expected_updated_at: string;
  tags: string[];
  fandom_tags: string[];
  very_nsfw: boolean;
  hide_on_owner_profile: boolean;
  allow_use_as_template: boolean;
  send_notification: boolean;
  definition_protection: "open";
  image_id: string;
  image_crop_zoom?: number | null;
  image_crop_x?: number | null;
  image_crop_y?: number | null;
}

interface PlaybookDefinition {
  variables: PlaybookVariable[];
  starting_context: StartingContext;
  rules: PlaybookRules;
  starting_scenarios: StartingScenario[];
  status_template: string;
  prompt_template: string | null;
}

interface PlaybookVariable {
  id: string;
  name: string;
  hide_from_status: boolean;
  type: "boolean" | string;
  default: boolean;
  true_description: string;
  false_description: string;
}

interface StartingContext {
  lorebooks: StartingLorebook[];
}

interface StartingLorebook {
  lorebook_id: string;
  default_enabled: boolean;
  chapters: StartingChapter[];
}

interface StartingChapter {
  chapter_id: string;
}

interface PlaybookRules {
  phase_1: PlaybookRule[];
  phase_2: PlaybookRule[];
}

interface PlaybookRule {
  [key: string]: unknown;
}

interface StartingScenario {
  [key: string]: unknown;
}
export default class SaucePlaybooks {
  constructor(
    private readonly http: Requester,
    private readonly session: Session,
  ) {}
  async createPlaybook(
    playbook: PlaybookPayload,
  ): Promise<{ playbook_id: string }> {
    this.session.getMe();
    const request = await this.http.request<{ playbook_id: string }>(
      "/api/v2/playbooks",
      {
        method: "POST",
        body: playbook,
      },
    );
    return request;
  }
  async updatePlaybook(
    playbookId: string,
    playbook: PlaybookPayload,
  ): Promise<{ playbook_id: string }> {
    this.session.getMe();
    const request = await this.http.request<{ playbook_id: string }>(
      `/api/v2/playbooks/${playbookId}`,
      {
        method: "PUT",
        body: playbook,
      },
    );
    return request;
  }
  async attachCompanionToPlaybook(
    playbookId: string,
    companionId: string,
  ): Promise<string> {
    this.session.getMe();
    const request = await this.http.request<{
      attachment: { approval_status: string };
    }>(`/api/v2/companions/${companionId}`, {
      method: "POST",
      body: { playbook_id: playbookId },
    });
    return request.attachment.approval_status;
  }
  async deletePlaybook(playbookId: string): Promise<void> {
    this.session.getMe();
    const request = await this.http.request<void>(`/api/v2/playbooks/${playbookId}`, {
      method: "DELETE",
    });
    return request;
  }
}
