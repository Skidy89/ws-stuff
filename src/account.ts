import Parser from "./parser.js";
import Requester from "./requester.js";
const INVALID_AUTH = "auth.missing_authorization";
export default class SaucePan {
    private auth: string;
    public requester: Requester;
    constructor(auth: string) {
        this.auth = auth;
        this.requester = new Requester();
    }
    private async getAuth() {
        this.requester.updateToken(this.auth);
        return this.auth;
    }
    async isAuthValid() {
        this.getAuth();
        const request = await this.requester.request("https://saucepan.ai/api/v1/users/me", {
            options: {
                headers: {
                    method: "GET",
                }
            },
            shouldIncludeAuthorization: true,
        });
        if (!request.ok) throw new Error(`Request failed with status ${request.status}`);
        const data = await Parser.parseJSON(request);
        if (data?.error?.code === INVALID_AUTH) {
            throw new Error("Invalid authorization token");
        }
        return data;
    }
    private async getCompanionInfo(id: string) {
        const request = await this.requester.request(`https://saucepan.ai/api/v2/companions/${id}`, {
            options: {
                headers: {
                    method: "GET",
                }
            },
            shouldIncludeAuthorization: true,
        });
        if (!request.ok) throw new Error(`Request failed with status ${request.status}`);
        const data = await Parser.parseJSON(request);
        return data;
    }
    async startCompanionChat(id: string) {
        const info = await this.getCompanionInfo(id);
        const payload = JSON.stringify({ chat_name: info.companion.name, companion_id: id, persona_id: info.companion.id, scenario_id: info.companion.starting_scenarios_fragments[0].id, metadata: { is_director: false }});
        console.log("Starting chat with companion:", info.name, "with payload:", payload);
        const request = await this.requester.request(`https://saucepan.ai/api/v1/core/create-chat`, {
            options: {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: payload,
            },
            shouldIncludeAuthorization: true,
        })
        if (!request.ok) throw new Error(`Request failed with status ${request.status}`);
        const data = await Parser.parseJSON(request);
        return data;
    }

}