import "dotenv/config";
import { openAsBlob } from "node:fs";
import { basename } from "node:path";
import boxen from "boxen";
import chalk from "chalk";
import Table from "cli-table3";
import ora from "ora";
import {
  checkbox,
  confirm,
  input,
  number,
  select,
  Separator,
} from "@inquirer/prompts";
import SaucePan from "./client.js";
import type { Persona } from "./persona.js";

type Companion = Awaited<
  ReturnType<SaucePan["companions"]["searchCompanions"]>
>[number];
type Chat = Awaited<ReturnType<SaucePan["chats"]["createChat"]>>;
type GenerateOptions = NonNullable<
  Parameters<SaucePan["chats"]["generateMessage"]>[2]
>;
type ResponseStyle = NonNullable<GenerateOptions["simpleResponseInstructions"]>;
type ImageItem = Awaited<ReturnType<SaucePan["images"]["uploadImage"]>>;
type Target = { id: string; name: string };
type Line = { speaker: string; text: string; isUser: boolean };

const token = process.env.BEARER;
if (!token) {
  console.error(chalk.red.bold("Error:"), "BEARER is not set in .env");
  process.exit(1);
}

const ORDER_BY = [
  "popularity",
  "trending",
  "created",
  "updated",
  "portrait_count",
  "group_count",
  "lorebook_count",
  "scenario_count",
  "random",
  "name",
  "favorited_at",
] as const;

const isExit = (error: unknown) =>
  error instanceof Error && error.name === "ExitPromptError";

const settle = () => new Promise((resolve) => setTimeout(resolve, 1500));

async function step<T>(label: string, task: () => Promise<T>): Promise<T> {
  const spinner = ora({ text: label, color: "magenta" }).start();
  const startedAt = performance.now();
  try {
    const result = await task();
    const elapsed = Math.round(performance.now() - startedAt);
    spinner.succeed(`${label} ${chalk.dim(`(${elapsed}ms)`)}`);
    return result;
  } catch (error) {
    spinner.fail(label);
    throw error;
  }
}

async function pick<T extends string>(
  message: string,
  values: readonly T[],
  fallback?: T,
): Promise<T> {
  return select<T>({
    message,
    choices: values.map((value) => ({ name: value, value })),
    default: fallback,
  });
}

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toIso = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${trimmed}`);
  return date.toISOString();
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

const displayName = (companion: { name: string; display_name?: string }) =>
  companion.display_name || companion.name;

const heading = (title: string) =>
  console.log(`\n${chalk.bold.magenta(title)}`);

const printBanner = () =>
  console.log(
    boxen(`${chalk.bold("SaucePan")}\n${chalk.dim("Full client showcase")}`, {
      padding: { top: 0, bottom: 0, left: 3, right: 3 },
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: "round",
      borderColor: "magenta",
      textAlignment: "center",
    }),
  );

function printCompanions(companions: Companion[], offset: number) {
  const table = new Table({
    head: ["#", "Name", "Author", "Tags", "Chats", "Favorites"].map((h) =>
      chalk.cyan(h),
    ),
    style: { head: [], border: ["gray"] },
  });
  companions.forEach((companion, index) =>
    table.push([
      offset + index + 1,
      displayName(companion),
      `@${companion.author_handle}`,
      companion.tags.slice(0, 4).join(", "),
      companion.chat_count,
      companion.favorite_count,
    ]),
  );
  console.log(`\n${table.toString()}\n`);
}

function printImages(items: ImageItem[]) {
  const table = new Table({
    head: ["Name", "Size", "Dimensions", "Type", "Image ID"].map((h) =>
      chalk.cyan(h),
    ),
    style: { head: [], border: ["gray"] },
  });
  items.forEach((item) =>
    table.push([
      item.name,
      formatBytes(item.filesize),
      `${item.metadata.width}x${item.metadata.height}`,
      item.metadata.type,
      chalk.dim(item.image.id),
    ]),
  );
  console.log(`\n${table.toString()}\n`);
}

function printPersonas(personas: Persona[]) {
  const table = new Table({
    head: ["Name", "Chat name", "Pronouns", "Color", "ID"].map((h) =>
      chalk.cyan(h),
    ),
    style: { head: [], border: ["gray"] },
  });
  personas.forEach((persona) =>
    table.push([
      persona.name,
      persona.chat_name,
      persona.pronouns,
      chalk.hex(persona.color || "#ffffff")(persona.color),
      chalk.dim(persona.id),
    ]),
  );
  console.log(`\n${table.toString()}\n`);
}

function printLine({ speaker, text, isUser }: Line) {
  const color = isUser ? chalk.green : chalk.magenta;
  console.log(`\n${color.bold(speaker)}\n${text}\n`);
}

function loadPersonas(sauce: SaucePan): Persona[] {
  const raw: unknown = sauce.personas.getPersonas();
  const value = typeof raw === "function" ? raw.call(sauce.account) : raw;
  return Array.isArray(value) ? (value as Persona[]) : [];
}

async function pickPersona(
  personas: Persona[],
  message: string,
): Promise<Persona> {
  return select<Persona>({
    message,
    choices: personas.map((persona) => ({
      name: persona.name,
      value: persona,
      description: persona.description,
    })),
  });
}

async function uploadFlow(sauce: SaucePan): Promise<ImageItem> {
  const source = await input({
    message: "Image file path or URL:",
    validate: (value) => (value.trim() ? true : "Required"),
  });
  const trimmed = source.trim();
  const isUrl = /^https?:\/\//i.test(trimmed);
  const defaultName = isUrl
    ? basename(new URL(trimmed).pathname) || "image"
    : basename(trimmed);
  const name = await input({
    message: "Name in your library:",
    default: defaultName,
  });
  const payload = isUrl ? trimmed : await openAsBlob(trimmed);
  const item = await step("Uploading image", () =>
    sauce.images.uploadImage(payload, name),
  );
  console.log(chalk.dim(sauce.images.formatImage(item.image.id)));
  return item;
}

async function pickImage(sauce: SaucePan): Promise<ImageItem> {
  const { images } = await step("Loading image library", () =>
    sauce.images.getImageLibrary(),
  );
  if (images.image_items.length === 0) return uploadFlow(sauce);

  const choice = await select<ImageItem | "upload">({
    message: "Choose an image:",
    choices: [
      ...images.image_items.map((item) => ({
        name: `${item.name} (${item.metadata.width}x${item.metadata.height})`,
        value: item,
      })),
      new Separator(),
      { name: "Upload a new image", value: "upload" as const },
    ],
  });
  return choice === "upload" ? uploadFlow(sauce) : choice;
}

async function askResponseStyle(): Promise<ResponseStyle> {
  return {
    dialogue: await pick(
      "Dialogue:",
      ["dialogue", "balanced", "narration"] as const,
      "balanced",
    ),
    intimacy: await pick(
      "Intimacy:",
      ["platonic", "romantic", "sexual", "smut"] as const,
      "platonic",
    ),
    length: await pick(
      "Length (longer is slower):",
      ["short", "ramble", "essay"] as const,
      "short",
    ),
    pacing: await pick("Pacing:", ["slow", "fast"] as const, "slow"),
    pov: "text_messaging",
    speakFor: await pick(
      "Speak for:",
      ["companion", "both"] as const,
      "companion",
    ),
  };
}

async function searchCompanions(sauce: SaucePan): Promise<Companion | null> {
  heading("Companion search");
  const text = await input({ message: "Search text:", default: "meisho doto" });
  const orderBy = await pick("Order by:", ORDER_BY, "popularity");
  const asc = await confirm({ message: "Ascending order?", default: false });
  const required = splitList(
    await input({ message: "Required tags (comma separated, optional):" }),
  );
  const excluded = splitList(
    await input({ message: "Excluded tags (comma separated, optional):" }),
  );
  const sus = await confirm({
    message: "Include sus content?",
    default: false,
  });
  const extraSpicy = await confirm({
    message: "Extra spicy only?",
    default: false,
  });
  const hideHidden = await confirm({
    message: "Hide hidden content?",
    default: false,
  });
  const matchAllFandoms = await confirm({
    message: "Match all fandom tags?",
    default: false,
  });
  const postedFrom = toIso(
    await input({ message: "Posted after (YYYY-MM-DD, optional):" }),
  );
  const postedTo = toIso(
    await input({ message: "Posted before (YYYY-MM-DD, optional):" }),
  );
  const limit =
    (await number({
      message: "Results per page:",
      default: 10,
      min: 1,
      max: 50,
    })) ?? 10;

  let offset = 0;
  while (true) {
    const results = await step(`Searching "${text}" (offset ${offset})`, () =>
      sauce.companions.searchCompanions({
        text_search: text,
        order_by: orderBy,
        asc,
        cnf_tags: required.map((tag) => [tag]),
        excluded_tags: excluded,
        extra_spicy: extraSpicy ? true : null,
        hide_hidden_content: hideHidden,
        match_all_fandom_tags: matchAllFandoms,
        posted_at_from: postedFrom,
        posted_at_to: postedTo,
        sus,
        limit,
        offset,
      }),
    );

    if (results.length === 0) {
      console.log(
        chalk.yellow(
          offset === 0 ? "\nNo companions found." : "\nNo more results.",
        ),
      );
      if (offset === 0) return null;
      offset = Math.max(0, offset - limit);
      continue;
    }

    printCompanions(results, offset);

    const choice = await select<Companion | "next" | "prev" | "back">({
      message: "Pick a companion:",
      choices: [
        ...results.map((companion) => ({
          name: displayName(companion),
          value: companion,
          description: companion.short_description,
        })),
        new Separator(),
        ...(results.length === limit
          ? [{ name: "Next page", value: "next" as const }]
          : []),
        ...(offset > 0
          ? [{ name: "Previous page", value: "prev" as const }]
          : []),
        { name: "Back to menu", value: "back" as const },
      ],
    });

    if (choice === "back") return null;
    if (choice === "next") offset += limit;
    else if (choice === "prev") offset = Math.max(0, offset - limit);
    else return choice;
  }
}

async function vibeSearch(sauce: SaucePan): Promise<Companion | null> {
  heading("Vibe search (much slower than a normal search)");
  const prompt = await input({
    message: "Describe the vibe you are looking for:",
    validate: (value) => (value.trim() ? true : "Required"),
  });
  const flags = await checkbox({
    message: "Filters:",
    choices: [
      { name: "Include sus content", value: "sus" },
      { name: "Extra spicy", value: "extra_spicy" },
      { name: "Match all fandoms", value: "match_all_fandoms" },
      { name: "Include hidden", value: "include_hidden" },
      { name: "Only followed", value: "only_followed" },
      { name: "Exclude followed", value: "exclude_followed" },
      { name: "Exclude favorites", value: "exclude_favorites" },
      { name: "Open definition only", value: "open_definition_only" },
    ],
  });
  const fandomTags = splitList(
    await input({ message: "Fandom tags (comma separated, optional):" }),
  );
  const required = splitList(
    await input({ message: "Required tags (comma separated, optional):" }),
  );
  const excluded = splitList(
    await input({ message: "Excluded tags (comma separated, optional):" }),
  );
  const seed = (
    await input({ message: "Seed companion ID (optional):" })
  ).trim();
  const seconds =
    (await number({
      message: "Poll interval in seconds:",
      default: 5,
      min: 1,
    })) ?? 5;

  const results = await step("Running vibe search", () =>
    sauce.companions.searchVibeCompanions(
      {
        prompt,
        cnf_tags: required.length ? required : null,
        excluded_tags: excluded.length ? excluded : null,
        fandom_tags: fandomTags,
        seed_companion_id: seed || null,
        sus: flags.includes("sus"),
        extra_spicy: flags.includes("extra_spicy"),
        match_all_fandoms: flags.includes("match_all_fandoms"),
        include_hidden: flags.includes("include_hidden"),
        only_followed: flags.includes("only_followed"),
        exclude_followed: flags.includes("exclude_followed"),
        exclude_favorites: flags.includes("exclude_favorites"),
        open_definition_only: flags.includes("open_definition_only"),
      },
      seconds * 1000,
      AbortSignal.timeout(6 * 60_000),
    ),
  );

  if (results.length === 0) {
    console.log(chalk.yellow("\nNo recommendations."));
    return null;
  }

  printCompanions(results, 0);

  const choice = await select<Companion | "back">({
    message: "Pick a companion:",
    choices: [
      ...results.map((companion) => ({
        name: displayName(companion),
        value: companion,
        description: companion.short_description,
      })),
      new Separator(),
      { name: "Back to menu", value: "back" as const },
    ],
  });
  return choice === "back" ? null : choice;
}

async function showDetails(sauce: SaucePan, id: string) {
  const { companion } = await step("Fetching companion", () =>
    sauce.companions.getCompanion(id),
  );

  console.log(
    boxen(
      [
        chalk.bold(companion.display_name || companion.name),
        chalk.dim(`@${companion.author_handle}`),
        "",
        companion.short_description ?? "",
      ].join("\n"),
      {
        padding: 1,
        margin: { top: 1, bottom: 0, left: 0, right: 0 },
        borderStyle: "round",
        borderColor: "cyan",
      },
    ),
  );

  const table = new Table({ style: { head: [], border: ["gray"] } });
  const rows: Record<string, unknown> = {
    Tags: (companion.tags ?? []).join(", "),
    Chats: companion.chat_count,
    Interactions: companion.interaction_count,
    Favorites: companion.favorite_count,
    Portraits: companion.portrait_count,
    Scenarios:
      companion.starting_scenarios_fragments?.length ??
      companion.scenario_count,
    Lorebooks: companion.lorebook_count,
    Playbook: companion.has_playbook ? "yes" : "no",
    Posted: companion.posted_at,
    Updated: companion.updated_at,
  };
  Object.entries(rows).forEach(([key, value]) =>
    table.push({ [chalk.cyan(key)]: String(value ?? "-") }),
  );
  console.log(`${table.toString()}\n`);
}

async function startWithPersona(
  sauce: SaucePan,
  target: Target,
): Promise<Chat | null> {
  const personas = loadPersonas(sauce);
  if (personas.length === 0) {
    console.log(
      chalk.yellow(
        "\nYou have no personas yet. Create one from the main menu.",
      ),
    );
    return null;
  }
  const persona = await pickPersona(personas, "Chat as which persona?");
  await step(`Starting chat as ${persona.name}`, () =>
    sauce.chats.startChat(target.id, { persona }),
  );
  return step("Loading chat state", () => sauce.chats.getLatestChat(target.id));
}

function printChatHelp() {
  const table = new Table({
    head: [chalk.cyan("Command"), chalk.cyan("Description")],
    style: { head: [], border: ["gray"] },
  });
  table.push(
    ["/help", "Show this list"],
    ["/history", "Show the last 20 messages"],
    [
      "/style",
      "Configure simple response instructions (use /style off to clear)",
    ],
    ["/describe <text>", "Set custom response description (empty to clear)"],
    ["/model <alias>", "Set the model alias (empty for default)"],
    [
      "/promote <id>",
      "Set promotedMessageId for next messages (empty to clear)",
    ],
    ["/utc <minutes>", "Override UTC offset in minutes (empty to reset)"],
    ["/portrait", "Print the last companion portrait URL"],
    ["/settings", "Show the current generation options"],
    ["/exit", "Leave the chat"],
  );
  console.log(`\n${table.toString()}\n`);
}

async function chatSession(sauce: SaucePan, chat: Chat, companionName: string) {
  heading(`Chat with ${companionName}`);
  console.log(chalk.dim(`Chat ${chat.chat_id}. Type /help for commands.`));

  const options: GenerateOptions = {
    pollIntervalMs: 3_000,
    timeoutMs: 180_000,
  };
  const transcript: Line[] = (chat.messages ?? []).map((message) => ({
    speaker: message.role === "user" ? "You" : companionName,
    text: message.content,
    isUser: message.role === "user",
  }));
  let lastPortrait: string | null = null;

  transcript.slice(-5).forEach(printLine);

  while (true) {
    const text = (await input({ message: chalk.green("You") })).trim();
    if (!text) continue;

    if (text.startsWith("/")) {
      const [command, ...rest] = text.slice(1).split(" ");
      const arg = rest.join(" ").trim();

      if (command === "exit") return;
      if (command === "help") printChatHelp();
      else if (command === "history") transcript.slice(-20).forEach(printLine);
      else if (command === "settings") console.log(options);
      else if (command === "style") {
        options.simpleResponseInstructions =
          arg === "off" ? undefined : await askResponseStyle();
        console.log(chalk.dim("Response style updated."));
      } else if (command === "describe") {
        options.responseDescription = arg || undefined;
        console.log(chalk.dim("Response description updated."));
      } else if (command === "model") {
        options.modelAlias = arg || undefined;
        console.log(
          chalk.dim(`Model alias: ${options.modelAlias ?? "default"}`),
        );
      } else if (command === "promote") {
        options.promotedMessageId = arg || null;
        console.log(
          chalk.dim(`Promoted message: ${options.promotedMessageId ?? "none"}`),
        );
      } else if (command === "utc") {
        const minutes = arg ? Number(arg) : undefined;
        if (minutes !== undefined && Number.isNaN(minutes)) {
          console.log(chalk.red("UTC offset must be a number of minutes."));
        } else {
          options.utcOffsetMinutes = minutes;
          console.log(chalk.dim(`UTC offset: ${minutes ?? "automatic"}`));
        }
      } else if (command === "portrait") {
        console.log(
          lastPortrait
            ? sauce.images.formatImage(lastPortrait)
            : chalk.dim("No portrait yet."),
        );
      } else {
        console.log(chalk.yellow(`Unknown command: /${command}`));
      }
      continue;
    }

    transcript.push({ speaker: "You", text, isUser: true });

    try {
      const reply = await step(`${companionName} is typing`, () =>
        sauce.chats.generateMessage(chat, text, {
          ...options,
          signal: AbortSignal.timeout((options.timeoutMs ?? 180_000) + 10_000),
        }),
      );
      lastPortrait = reply.companionPortrait ?? lastPortrait;
      const line = {
        speaker: companionName,
        text: reply.message,
        isUser: false,
      };
      transcript.push(line);
      printLine(line);
      console.log(chalk.dim(`generation ${reply.generationId}`));
    } catch (error) {
      if (isExit(error)) throw error;
      console.error(
        chalk.red("Generation failed:"),
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function companionActions(sauce: SaucePan, target: Target) {
  while (true) {
    const action = await select<
      "details" | "new" | "resume" | "persona" | "back"
    >({
      message: `${target.name}:`,
      choices: [
        { name: "Show details", value: "details" },
        { name: "Start a new chat", value: "new" },
        { name: "Resume latest chat", value: "resume" },
        { name: "Start a new chat as a persona", value: "persona" },
        { name: "Back", value: "back" },
      ],
    });
    if (action === "back") return;

    try {
      let chat: Chat | null = null;
      if (action === "details") await showDetails(sauce, target.id);
      else if (action === "new")
        chat = await step("Creating chat", () =>
          sauce.chats.createChat(target.id),
        );
      else if (action === "resume")
        chat = await step("Loading latest chat", () =>
          sauce.chats.getLatestChat(target.id),
        );
      else if (action === "persona")
        chat = await startWithPersona(sauce, target);

      if (chat) await chatSession(sauce, chat, target.name);
    } catch (error) {
      if (isExit(error)) throw error;
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function openById(sauce: SaucePan) {
  const id = (
    await input({
      message: "Companion ID:",
      validate: (value) => (value.trim() ? true : "Required"),
    })
  ).trim();
  const { companion } = await step("Fetching companion", () =>
    sauce.companions.getCompanion(id),
  );
  await companionActions(sauce, {
    id,
    name: companion.display_name || companion.name,
  });
}

async function personaMenu(sauce: SaucePan) {
  while (true) {
    const action = await select<
      "list" | "create" | "edit" | "default" | "delete" | "back"
    >({
      message: "Personas:",
      choices: [
        { name: "List personas", value: "list" },
        { name: "Create persona", value: "create" },
        { name: "Edit persona", value: "edit" },
        { name: "Set default persona", value: "default" },
        { name: "Delete personas", value: "delete" },
        { name: "Back", value: "back" },
      ],
    });
    if (action === "back") return;

    try {
      const personas = loadPersonas(sauce);
      const needsExisting = action !== "list" && action !== "create";
      if (needsExisting && personas.length === 0) {
        console.log(chalk.yellow("\nNo personas yet."));
        continue;
      }

      if (action === "list") {
        if (personas.length === 0)
          console.log(chalk.yellow("\nNo personas yet."));
        else printPersonas(personas);
      } else if (action === "create") {
        const name = await input({
          message: "Name:",
          validate: (v) => (v.trim() ? true : "Required"),
        });
        const image = await pickImage(sauce);
        const persona: Persona = {
          id: "",
          name,
          image: { id: image.image.id },
          additional_images: [],
          chat_name: await input({ message: "Chat name:", default: name }),
          color: await input({ message: "Color (hex):", default: "#a855f7" }),
          description: await input({ message: "Description:" }),
          folder: null,
          lorebook_id: null,
          pronouns: await input({ message: "Pronouns:", default: "they/them" }),
          voice_catalog_id: null,
        };
        await step("Creating persona", () =>
          sauce.personas.createPersona(persona),
        );
        await settle();
      } else if (action === "edit") {
        const current = await pickPersona(personas, "Edit which persona?");
        const updated: Persona = {
          ...current,
          name: await input({ message: "Name:", default: current.name }),
          chat_name: await input({
            message: "Chat name:",
            default: current.chat_name,
          }),
          color: await input({
            message: "Color (hex):",
            default: current.color,
          }),
          description: await input({
            message: "Description:",
            default: current.description,
          }),
          pronouns: await input({
            message: "Pronouns:",
            default: current.pronouns,
          }),
        };
        if (await confirm({ message: "Change the image?", default: false })) {
          const image = await pickImage(sauce);
          updated.image = { id: image.image.id };
        }
        await step("Saving persona", () => sauce.personas.editPersona(updated));
        await settle();
      } else if (action === "default") {
        const persona = await pickPersona(personas, "Default persona:");
        await step(`Setting ${persona.name} as default`, () =>
          sauce.personas.setDefaultPersona(persona.id),
        );
        await settle();
      } else if (action === "delete") {
        const ids = await checkbox({
          message: "Select personas to delete:",
          choices: personas.map((persona) => ({
            name: persona.name,
            value: persona.id,
          })),
        });
        if (
          ids.length &&
          (await confirm({
            message: `Delete ${ids.length} persona(s)?`,
            default: false,
          }))
        ) {
          await step("Deleting personas", () =>
            sauce.personas.deletePersona(ids),
          );
          await settle();
        }
      }
    } catch (error) {
      if (isExit(error)) throw error;
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function imageMenu(sauce: SaucePan) {
  while (true) {
    const action = await select<"library" | "upload" | "url" | "back">({
      message: "Images:",
      choices: [
        { name: "Show image library", value: "library" },
        { name: "Upload an image", value: "upload" },
        { name: "Get CDN URL for an image", value: "url" },
        { name: "Back", value: "back" },
      ],
    });
    if (action === "back") return;

    try {
      if (action === "library") {
        const { images } = await step("Loading image library", () =>
          sauce.images.getImageLibrary(),
        );
        if (images.image_items.length === 0) {
          console.log(chalk.yellow("\nYour library is empty."));
          continue;
        }
        printImages(images.image_items);
        console.log(
          chalk.dim(
            `${images.total_count} image(s), ${formatBytes(images.total_filesize)} total, ` +
              `${formatBytes(images.average_filesize)} average\n`,
          ),
        );
      } else if (action === "upload") {
        await uploadFlow(sauce);
      } else if (action === "url") {
        const image = await pickImage(sauce);
        console.log(`\n${sauce.images.formatImage(image.image.id)}\n`);
      }
    } catch (error) {
      if (isExit(error)) throw error;
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function main() {
  printBanner();

  const sauce = new SaucePan(token!);
  await step("Authenticating", () => sauce.authenticate());

  const menu: { name: string; run: (() => Promise<void>) | null }[] = [
    {
      name: "Search companions",
      run: async () => {
        const companion = await searchCompanions(sauce);
        if (companion)
          await companionActions(sauce, {
            id: companion.id,
            name: displayName(companion),
          });
      },
    },
    {
      name: "Vibe search (slow)",
      run: async () => {
        const companion = await vibeSearch(sauce);
        if (companion)
          await companionActions(sauce, {
            id: companion.id,
            name: displayName(companion),
          });
      },
    },
    { name: "Open companion by ID", run: () => openById(sauce) },
    { name: "Personas", run: () => personaMenu(sauce) },
    { name: "Images", run: () => imageMenu(sauce) },
    {
      name: "Account",
      run: async () => {
        console.dir(sauce.account, { depth: 2, colors: true });
      },
    },
    { name: "Quit", run: null },
  ];

  while (true) {
    const choice = await select({
      message: "What do you want to do?",
      choices: menu.map((item) => ({ name: item.name, value: item })),
    });
    if (!choice.run) break;

    try {
      await choice.run();
    } catch (error) {
      if (isExit(error)) throw error;
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(chalk.dim("\nSession ended."));
}

main().catch((error) => {
  if (isExit(error)) {
    console.log(chalk.dim("\nSession ended."));
    process.exit(0);
  }
  console.error(
    `\n${chalk.red.bold("Unexpected error:")}`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
