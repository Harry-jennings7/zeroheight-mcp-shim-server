// src/services/zeroheight.ts
import axios, { AxiosError, AxiosInstance } from "axios";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const rawBase =
  process.env.ZEROHEIGHT_BASE_URL || "https://zeroheight.com/open_api/v2/";
// normalize to always have single trailing slash
const baseURL = rawBase.replace(/\/+$/, "") + "/";

const insecure = String(process.env.INSECURE_TLS).toLowerCase() === "true";
const cafile =
  process.env.ZEROHEIGHT_CA_BUNDLE || process.env.NODE_EXTRA_CA_CERTS || "";

// Build an https agent that works in Node (and inside Docker)
function makeHttpsAgent(): https.Agent | undefined {
  if (insecure) {
    return new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
    });
  }
  if (cafile && fs.existsSync(cafile)) {
    const ca = fs.readFileSync(cafile);
    return new https.Agent({
      ca,
      keepAlive: true,
    });
  }
  // fall back to system CAs
  return new https.Agent({ keepAlive: true });
}

// Very light retry (429/5xx) with backoff
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let delay = 300; // ms
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const code = (err as AxiosError)?.response?.status || 0;
      const retriable =
        code === 429 ||
        (code >= 500 && code < 600) ||
        err.code === "ECONNRESET";
      if (!retriable || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, 2000);
    }
  }
  // unreachable
  throw new Error("retry exhausted");
}

export class Zeroheight {
  private client: AxiosInstance;

  constructor() {
    const clientId = process.env.ZEROHEIGHT_CLIENT_ID;
    const token = process.env.ZEROHEIGHT_TOKEN;

    if (!clientId || !token) {
      throw new Error(
        "Missing ZEROHEIGHT_CLIENT_ID or ZEROHEIGHT_TOKEN in env. " +
          "Create an auth token in Zeroheight and set both values. " +
          "Docs: https://developers.zeroheight.com/",
      );
    }

    this.client = axios.create({
      baseURL,
      timeout: 20000,
      headers: {
        "X-API-CLIENT": clientId, // zhci_...
        "X-API-KEY": token, // zhat_...
        "Content-Type": "application/json",
      },
      httpsAgent: makeHttpsAgent(),
      // NB: proxy: false  // if you need to bypass env HTTP(S)_PROXY
    });
  }

  // Some orgs have this; if not, it returns 404 per docs
  async listStyleguides() {
    return withRetry(async () => {
      const res = await this.client.get("styleguides");
      // Docs vary on shape; handle both {items: [...] } or raw array
      return (res.data?.items ?? res.data ?? []) as unknown[];
    });
  }

  async getTree(styleguideId: string) {
    return withRetry(async () => {
      const res = await this.client.get(`styleguides/${styleguideId}/tree`);
      return res.data ?? {};
    });
  }

  async listPages(styleguideId: string, query?: string) {
    return withRetry(async () => {
      const res = await this.client.get(`styleguides/${styleguideId}/pages`, {
        params: query ? { query } : undefined,
      });
      return (res.data?.items ?? res.data ?? []) as unknown[];
    });
  }

  async getPage(
    styleguideId: string,
    pageId: string,
    format: "markdown" | "json" = "markdown",
  ) {
    return withRetry(async () => {
      const res = await this.client.get(
        `styleguides/${styleguideId}/pages/${pageId}`,
        {
          params: { format },
        },
      );
      return res.data;
    });
  }
}
