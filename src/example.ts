import "dotenv/config";
import SaucePan from "./account.js";

const token = process.env.BEARER;
if (!token) throw new Error("BEARER is not set in .env");

const sauce = new SaucePan(token);
await sauce.authenticate();
console.log("authenticated!");
const image =  await sauce.getImageLibrary()
console.log("image library:", image);
console.log(image.images)
console.log(image.images.image_items[0]?.image.id)
const newPersona = await sauce.createPersona({
  name: `super mega persona ${Math.floor(Math.random() * 1000)}`,
  description: "lovely persona with a big heart and a big brain",
  image: {
    id: image.images?.image_items[0]?.image.id!,
  },
  additional_images: [],
  chat_name: "hola skid",
  color: "purple",
  folder: null,
  lorebook_id: null,
  pronouns: "xe,her,they",
  voice_catalog_id: null,
});

const chat = await sauce.getOrCreateChat(
  "020265cf-a73f-477d-af42-bb4797c0903a",
  newPersona[0]
);
//console.log(await sauce.generateMessage(chat, "i wove a tale of a dragon and a princess", { responseDescription: "A tale of a dragon and a princess" }));
console.log("message generated!");
console.log("image library:", await sauce.getImageLibrary());
console.log("great! image library fetched!");
console.log("uploading image...");
const imageUrl =
  "https://i.pinimg.com/736x/f8/f2/e6/f8f2e68342d9de63cbb859ee2b970465.jpg";
const uploadedImage = await sauce.uploadImage(imageUrl, "oguri!!");
console.log("image uploaded:", uploadedImage);
console.log("great! image uploaded!");
console.log("checking limits...");
const limits = await sauce.checkLimits();
console.log("limits:", limits);
console.log("great! limits checked!");
console.log("creating persona...");

console.log("great! persona created!\nnow testing getMe() again...");
const me = await sauce.getMe();
console.log("me:", me);
console.log(`my personas: ${me.getPersonas!.map((p) => p.name).join(", ")}`);
console.log("all done!");
