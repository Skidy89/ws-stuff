type RequesterOptions = {
    options?: RequestInit
    shouldIncludeAuthorization?: boolean
}

export default class Requester {
  private authorization: string = "";
  constructor() {}
  updateToken(token: string) {
    this.authorization = `${token}`;
  }
  async request(url: string, options?: RequesterOptions): Promise<Response> {
    const headers = new Headers(options?.options?.headers || {});
    if (options?.shouldIncludeAuthorization) {
      headers.set("Authorization", this.authorization);
    }
    headers.set("Referer", "https://saucepan.ai");
    headers.set("Origin", "https://saucepan.ai");
    return fetch(url, { ...options?.options, headers });
  }
}