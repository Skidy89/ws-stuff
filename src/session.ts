import { AccountMe } from "./me.js";
import type Requester from "./requester.js";

export class Session {
  account = new AccountMe();
  constructor(private readonly http: Requester) {
    this.http = http;
  }
  async authenticateMe() {
    const data = await this.http.request<any>("/api/v1/users/me");
    this.account.setData(data);
    return this.account;
  }
  getMe() {
    this.account.checkData();
    return this.account;
  }
  async updateMe() {
    await this.authenticateMe();
  }
  async checkLimits() {
    this.getMe();
    return this.http.request("/api/v1/premium/limits");
  }
}
