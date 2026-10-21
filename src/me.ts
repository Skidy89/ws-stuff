type UserProfile = {
  id: string;
  email: string;
  handle: string;
  name: string;
  image: ImageReference | null;
  is_verified: boolean;
  is_age_verified: boolean;
  is_banned: boolean;
  in_restricted_region: boolean;
  hidden_tags: string[];
  hidden_fandom_tags: string[];
  personas: Persona[];
  default_persona_id: string | null;
  has_hidden_content: boolean;
  has_followers: boolean;
  beta_enabled: boolean;
  increased_message_limits: boolean;
  slow_loading_screens: boolean;
  reduce_motion: boolean;
  minimal_navbar: boolean;
  auto_mark_notifications_read: boolean;
  custom_profile_display: string;
  disable_cosmetics: boolean;
  disable_macro_replacement: boolean;
  macro_highlight_style: string;
  comment_preview_lines: string;
  show_very_nsfw: boolean;
  show_token_counts: boolean;
  show_creation_dates: boolean;
  show_private_creations: boolean;
  hide_all_hints_in_editors: boolean;
  default_editor: string;
  show_all_the_toggles: boolean;
  show_homepage_cw_toggle: boolean;
  profile_hide_empty_sections: boolean;
  theme_settings: ThemeSettings;
  default_search_page: string;
  default_home_tab: string;
  default_following_tab: string;
  default_homepage_following_tab: string;
  default_favorites_page: string;
  permissions: unknown[];
  can_view_spicy: boolean;
  account_age_in_days: number;
  public_companion_count: number;
  can_equip_badge: boolean;
  accepted_tos: boolean;
  in_suicide_prevention_region: boolean;
  is_suspended: boolean;
  training_consent: boolean | null;
  quick_access_buttons: QuickAccessButton[];
  prompt_save_preference: string;
  onboarding_responses: OnboardingResponses;
  is_existing_user_pending_onboarding: boolean;
  tag_color_groups: unknown[];
};

type ImageReference = {
  id: string;
};

type Persona = {
  id: string;
  name: string;
  description: string;
  image: ImageReference | null;
  additional_images: ImageReference[];
  color: string | null;
  pronouns: string | null;
  voice_catalog_id: string | null;
  lorebook: unknown | null;
  chat_name: string | null;
  folder: string | null;
  folder_hue: number | null;
  folder_saturation: number | null;
};

type ThemeSettings = {
  current_theme: string;
  light_dark_preference: string;
  emoji_level: string;
  dark_mode_consistency: boolean;
  font_scale: number;
  show_tag_emojis: boolean;
  custom_theme_data: unknown | null;
};

type QuickAccessButton = {
  type: string;
};

type OnboardingResponses = {
  started_at: string;
  user_intent: string;
  completed_at: string;
  prior_homepage_tabs: HomepageTab[];
  content_filter_level: number;
  accessibility_changed: AccessibilitySettings;
  saw_creator_orientation: boolean;
  preferred_companion_gender: string;
};

type HomepageTab = {
  name: string;
  emoji: string;
  is_default: boolean;
  entity_type: string;
  search_params: SearchParams;
  homepage_sort_order: number;
};

type SearchParams = {
  asc: boolean;
  cnf_tags?: string[][];
  order_by: string;
  date_range: string | null;
  extra_spicy: boolean | null;
  fandom_tags: string[];
  text_search: string | null;
  excluded_tags: string[];
  has_playbook?: boolean;
  min_group_count: number;
  min_lorebook_count: number;
  min_portrait_count: number;
  min_scenario_count: number;
  excluded_fandom_tags: string[];
  open_definition_only: boolean;
  match_all_fandom_tags: boolean;
};

type AccessibilitySettings = {
  font_scale: number;
  colorblind_theme: string;
  images_uncensored: boolean;
  custom_profile_display: string;
};
export class AccountMe {
  constructor() {}
  private data: UserProfile | null = null;
  checkData() {
    if (!this.data) {
      throw new Error("User profile data is not set.");
    }
  }
  setData(data: UserProfile) {
    this.data = data;
  }

  get getId() {
    this.checkData();
    return this.data?.id;
  }

  get getHandle() {
    this.checkData();
    return this.data?.handle;
  }

  get getName() {
    this.checkData();
    return this.data?.name;
  }

  get getImage() {
    this.checkData();
    return this.data?.image;
  }

  get getPersonas() {
    return this.data?.personas;
  }

  get getDefaultPersona() {
    this.checkData();
    return (
      this.data?.personas.find((p) => p.id === this.data?.default_persona_id) ??
      null
    );
  }

  get getDefaultPersonaId() {
    this.checkData();
    return this.data?.default_persona_id;
  }

  get getThemeSettings() {
    this.checkData();
    return this.data?.theme_settings;
  }

  get getOnboardingResponses() {
    this.checkData();
    return this.data?.onboarding_responses;
  }

  get getPermissions() {
    this.checkData();
    return this.data?.permissions;
  }

  get getIsVerified() {
    this.checkData();
    return this.data?.is_verified;
  }

  get getIsBanned() {
    this.checkData();
    return this.data?.is_banned;
  }

  get getIsSuspended() {
    this.checkData();
    return this.data?.is_suspended;
  }

  get getCanViewSpicy() {
    this.checkData();
    return this.data?.can_view_spicy;
  }

  get getIncreasedMessageLimits() {
    this.checkData();
    return this.data?.increased_message_limits;
  }

  get getAccountAgeInDays() {
    this.checkData();
    return this.data?.account_age_in_days;
  }

  get getQuickAccessButtons() {
    this.checkData();
    return this.data?.quick_access_buttons;
  }

  get getData() {
    return this.data;
  }
}
