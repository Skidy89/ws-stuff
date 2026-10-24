import SauceChat from "./chat.js";
import SauceCommunity from "./community.js";
import SauceCompanions from "./companions.js";
import SauceImage from "./image.js";
import SauceLorebook from "./lorebook.js";
import SaucePersona from "./persona.js";
import Requester from "./requester.js";
import { Session } from "./session.js";

export default class SaucePan {
  readonly chats: SauceChat;
  readonly personas: SaucePersona;
  readonly images: SauceImage;
  readonly companions: SauceCompanions;
  readonly lorebooks: SauceLorebook;
  readonly community: SauceCommunity;
  private readonly session: Session;

  constructor(token: string, http = new Requester(token)) {
    this.session = new Session(http);
    this.companions = new SauceCompanions(http, this.session);
    this.chats = new SauceChat(http, this.session, this.companions);
    this.personas = new SaucePersona(http, this.session);
    this.images = new SauceImage(http, this.session);
    this.lorebooks = new SauceLorebook(http, this.session);
    this.community = new SauceCommunity(http, this.session);
  }
  async authenticate() {
    return this.session.authenticateMe();
  }
  get account() {
    return this.session.account;
  }
}
