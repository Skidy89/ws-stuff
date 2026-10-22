import type Requester from "./requester.js";
import type { Session } from "./session.js";

interface Personas {
  name: string;
  image: { id: string };
  additional_images: string[];
  chat_name: string;
  color: string;
  description: string;
  folder: string | null;
  lorebook_id: string | null;
  pronouns: string;
  voice_catalog_id: string | null;
}
export interface Persona extends Personas {
  id: string;
}

export default class SaucePersona {
  constructor(
    private readonly http: Requester,
    private readonly session: Session,
  ) {}
  async createPersona(persona: Persona): Promise<Persona[]> {
    this.session.getMe();
    if (!persona.image) throw new Error("Persona must have an image");
    if (!persona.name) throw new Error("Persona must have a name");
    if (persona.id)
      throw new Error("please dont use a id while creating a persona");
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
    void this.session.updateMe();
    return data.personas[0];
  }
  getPersonas() {
    return this.session.account.getPersonas;
  }
  async setDefaultPersona(personaId: string): Promise<void> {
    this.session.getMe();
    await this.http.request<any>("/api/v1/personas/default", {
      method: "PUT",
      body: {
        persona_id: personaId,
      },
    });
    void this.session.updateMe();
  }
  async editPersona(persona: Persona): Promise<Persona> {
    this.session.getMe();
    if (!persona.id) throw new Error("Persona must have an id");
    const data = await this.http.request<any>("/api/v1/personas", {
      method: "PATCH",
      body: {
        additional_images: persona.additional_images,
        chat_name: persona.chat_name,
        color: persona.color,
        description: persona.description,
        id: persona.id,
        image: {
          id: persona.image.id,
        },
        lorebook_id: persona.lorebook_id,
        name: persona.name,
        pronouns: persona.pronouns,
        voice_catalog_id: persona.voice_catalog_id,
      },
    });
    void this.session.updateMe();
    return data as Persona;
  }
  async deletePersona(personaIds: string[]): Promise<void> {
    this.session.getMe();
    await this.http.request<any>("/api/v1/personas", {
      method: "DELETE",
      body: {
        ids: personaIds,
      },
    });
    void this.session.updateMe();
  }
}
