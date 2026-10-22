import Parser from "./parser.js";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly body?: string,
  ) {
    super(`Request to ${url} failed with status ${status}`);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  auth?: boolean;
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default class Requester {
  constructor(
    private token = "",
    private readonly baseUrl = "https://saucepan.ai",
  ) {}

  setToken(token: string) {
    this.token = token;
  }
  async rawRequest<T = unknown>(
    url: string,
    opts: RequestOptions = {},
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        const isFormData = opts.body instanceof FormData;

        const res = await fetch(url, {
          method: opts.method ?? "GET",
          headers: {
            Accept: "application/json",
            Origin: this.baseUrl,
            Referer: this.baseUrl,
            ...(opts.body !== undefined &&
              !isFormData && {
                "Content-Type": "application/json",
              }),
            ...(opts.auth !== false && { Authorization: this.token }),
          },
          ...(opts.body !== undefined && {
            body: isFormData ? opts.body : JSON.stringify(opts.body),
          }),
          signal: AbortSignal.any([
            AbortSignal.timeout(opts.timeoutMs ?? 15_000),
            ...(opts.signal ? [opts.signal] : []),
          ]),
        });

        const text = (await Parser.parseJSON(res)) as T;
        if (res.ok) return text;

        const retryable = res.status === 429 || res.status >= 500;
        if (retryable && attempt < (opts.retries ?? 2)) {
          await sleep(500 * 2 ** attempt);
          continue;
        }

        throw new ApiError(res.status, url, text as string);
      } catch (err) {
        if (
          err instanceof ApiError ||
          opts.signal?.aborted ||
          attempt >= (opts.retries ?? 2)
        ) {
          throw err;
        }

        await sleep(500 * 2 ** attempt);
      }
    }
  }

  async request<T = unknown>(
    path: string,
    {
      method = "GET",
      body,
      auth = true,
      timeoutMs = 15_000,
      retries = 2,
      signal,
    }: RequestOptions = {},
  ): Promise<T> {
    const url = new URL(path, this.baseUrl).toString();

    for (let attempt = 0; ; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            Accept: "application/json",
            Origin: this.baseUrl,
            Referer: this.baseUrl,
            ...(body !== undefined && { "Content-Type": "application/json" }),
            ...(auth && { Authorization: this.token }),
          },
          ...(body !== undefined && { body: JSON.stringify(body) }),
          signal: AbortSignal.any([
            AbortSignal.timeout(timeoutMs),
            ...(signal ? [signal] : []),
          ]),
        });
        const text = (await Parser.parseJSON(res)) as T;
        if (res.ok) return text;

        const retryable = res.status === 429 || res.status >= 500;
        if (retryable && attempt < retries) {
          await sleep(500 * 2 ** attempt);
          continue;
        }
        throw new ApiError(res.status, url, text as unknown as string);
      } catch (err) {
        if (err instanceof ApiError || signal?.aborted || attempt >= retries)
          throw err;
        await sleep(500 * 2 ** attempt);
      }
    }
  }
}
