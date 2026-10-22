import sauceChat from "./chat.js";
import sauceCompanions from "./companions.js";
import SauceImage from "./image.js";
import SaucePersona from "./persona.js";
import Requester from "./requester.js";
import { Session } from "./session.js";

export default class SaucePan {
  readonly chats: sauceChat;
  readonly personas: SaucePersona;
  readonly images: SauceImage;
  readonly companions: sauceCompanions;
  private readonly session: Session;

  constructor(token: string, http = new Requester(token)) {
    this.session = new Session(http);
    this.companions = new sauceCompanions(http, this.session);
    this.chats = new sauceChat(http, this.session, this.companions);
    this.personas = new SaucePersona(http, this.session);
    this.images = new SauceImage(http, this.session);
  }

  authenticate() {
    return this.session.authenticateMe();
  }
  get account() {
    return this.session.account;
  }
}
