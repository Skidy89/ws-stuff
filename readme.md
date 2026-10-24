# SaucePan client

a simple client of [SaucePan](https://saucepan.ai/) with (almost) parity with the page
this cli includes features like *lorebooks*, *companion creation*, *messages* and more!

## how do i start??

to start, you need your SaucePan token!

- create a account on the [Sign up page](https://saucepan.ai/sign-up)
- after making a account, open your developer tools!
- refresh the page and search any sauce pan request
- copy the authorization (it should start with *Bearer!!*)
- done!

> [!WARNING]
> do not share this token to anyone, make sure to set up a *.env* file!
> whoever gets your token will have total access to your account!
> dont forget to include your token file into [gitignore](https://git-scm.com/docs/gitignore)

great, now we have our token, now what?

## setting up the package

after getting our token, now we can auth with SaucePan client
you can test it in the example file (npm run example)!

```ts
// your token file
import "dotenv/config";
import SaucePan from "./client.js";

const token = process.env.BEARER;

const cli = new SaucePan(token!)
await cli.authenticate()
console.log("authenticated!!")
```

note: you arent actually logged in in any site, this is just to make sure your data exists, still useful on many ways

## searching a companion

theres actually 2 ways to search a companion, search and vibe search (uses tokens)

search:
```ts
const companion = cli.companion.searchCompanions({
    text_search: "meisho doto",
    asc: false,
    cnf_tags: [],
    excluded_tags: [],
    extra_spicy: null,
    hide_hidden_content: false,
    limit: 0,
    match_all_fandom_tags: false,
    offset: 0,
    order_by: "trending",
    posted_at_from: null,
    posted_at_to: null,
    sus: false
})
```

vibe search:
```ts
const vibedCompanion = cli.companion.searchVibeCompanions({
   cnf_tags: null,
    exclude_favorites: false,
    exclude_followed: false,
    excluded_tags: null,
    extra_spicy: false,
    fandom_tags: [],
    include_hidden: false,
    match_all_fandoms: false,
    only_followed: false,
    open_definition_only: false,
    prompt: "umamusume", // your prompt
    seed_companion_id: null,
    sus: false
})
```

Note: vibe search is slow. i still dont know why saucePan use this weird system
it would be easier (and fastest) a websocket connection
i totally recommend normal search, you dont miss anything from vibe search

## sending a message

after fetching our companion, you probably like to send a message now,
heres how!

```ts
const companion = ... // fetched from searchCompanions or searchVibeCompanions
const chat = cli.chats.startChat(companions[0]!.id)
const {messsage} = cli.chats.generateMessage(chat, "Hello!")
console.log(message) // "Hi, my name is ..."
```

## creating a companion

this is weird, but i will try to...
creating a companion is probably the essencial stuff you want in clis like this
however you may wanna make your own in the website instead...

### upload a image to gallery

upload your image first!

```ts
const image = cli.images.uploadImage("https://your_image.png", "cool image")
```

if you already have one

```ts
const images = cli.images.getImageLibrary() // ImageItem[]
```

### now create your companion

```ts
const companion = cli.companions.createCompanion({
    access_level: "public",
    advanced_prompt: null,
    card: "",
    companion_profile_banner_crop_x: null,
    companion_profile_banner_crop_y: null,
    companion_profile_banner_crop_zoom: null,
    companion_profile_banner_image: null,
    companion_profile_banner_very_sus: false,
    display_name: "",
    example_dialogue: null,
    external_model_policy: "",
    fandom_tags: [],
    formatting_instructions: null,
    full_description: "",
    hidden_fields: 0,
    hide_on_owner_profile: false,
    image: null,
    image_crop_x: null,
    image_crop_y: null,
    image_crop_zoom: null,
    locked_starting_message: false,
    multiple_scenarios: false,
    name: "",
    open_definition: false,
    portraits: [],
    send_notification: false,
    short_description: "",
    soundcloud_url: null,
    starting_scenarios: [],
    suppress_companion_profile_banner: false,
    sus: false,
    tags: ["female"], // SUPER MEGA IMPORTANT
    temperature_offset_percentage: 0,
    unlocked_portraits: false,
    very_sus: false,
    voice_catalog_id: null
})

> [!WARNING]
> companions require a image id, and tags
> tags cant be made up, soon i will type all the tags i can collect without dying
> if you dont attach a *tag* or *image* the server will reject your companion

