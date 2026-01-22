import type { RequestHandler } from "express";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// import your tool handlers
import { listStyleguides } from "./tools/listStyleguides.js";
import { getStyleguideTree } from "./tools/getStyleguideTree.js";
import { listPages } from "./tools/listPages.js";
import { getPage } from "./tools/getPage.js";

// (1) Accept normalizer (helps curl users)

function normalizeAcceptHeader(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) {
  let accept = String(req.headers["accept"] || "")
    .toLowerCase()
    .trim();
  const needsJson = !accept.includes("application/json");
  const needsSse = !accept.includes("text/event-stream");

  const parts = accept
    ? accept
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  if (needsJson) parts.push("application/json");
  if (needsSse) parts.push("text/event-stream");

  req.headers["accept"] = parts.join(", ");
  next();
}

// (2) Helper to extract args from older SDK “extra” shape
function extractArgs(extra: any): Record<string, any> {
  return (
    extra?.params?.arguments ??
    extra?.request?.params?.arguments ??
    extra?.arguments ??
    extra?.body?.params?.arguments ??
    extra?.req?.body?.params?.arguments ??
    {}
  );
}

export function createMCPServer(): RequestHandler {
  const router = express.Router();

  // ⚠️ DO NOT use router.use(express.json()) here
  router.use(normalizeAcceptHeader);

  const mcp = new McpServer({ name: "zeroheight-mcp", version: "1.0.0" });

  // ---- Register tools (1.25.x style) ----
  mcp.registerTool(
    "list-styleguides",
    { description: "Lists styleguides available to the auth token." },
    async (_extra: any) => {
      const items = await listStyleguides();
      return {
        content: [{ type: "text", text: JSON.stringify({ items }, null, 2) }],
      };
    },
  );

  mcp.registerTool(
    "get-styleguide-tree",
    { description: "Returns the navigation tree for a styleguide." },
    async (extra: any) => {
      const input = extractArgs(extra);
      const styleguideId = input.styleguideId;
      if (!styleguideId) {
        return {
          content: [{ type: "text", text: "ERROR: Missing 'styleguideId'" }],
        };
      }
      const tree = await getStyleguideTree({ styleguideId });
      return {
        content: [{ type: "text", text: JSON.stringify(tree, null, 2) }],
      };
    },
  );

  mcp.registerTool(
    "list-pages",
    { description: "Lists or searches pages within a styleguide." },
    async (extra: any) => {
      const input = extractArgs(extra);
      const styleguideId = input.styleguideId;
      const query = input.query || undefined;
      if (!styleguideId) {
        return {
          content: [{ type: "text", text: "ERROR: Missing 'styleguideId'" }],
        };
      }
      const items = await listPages({ styleguideId, query });
      return {
        content: [{ type: "text", text: JSON.stringify({ items }, null, 2) }],
      };
    },
  );

  mcp.registerTool(
    "get-page",
    { description: "Gets a page in markdown or json." },
    async (extra: any) => {
      const input = extractArgs(extra);
      const styleguideId = input.styleguideId;
      const pageId = input.pageId;
      const format = input.format ?? "markdown";
      if (!styleguideId || !pageId) {
        return {
          content: [
            { type: "text", text: "ERROR: Missing 'styleguideId' or 'pageId'" },
          ],
        };
      }
      const page = await getPage({ styleguideId, pageId, format });
      const isObj = page && typeof page === "object";
      return {
        content: [
          {
            type: "text",
            text: isObj ? JSON.stringify(page, null, 2) : String(page),
          },
        ],
      };
    },
  );

  // ---- Streamable HTTP transport ----
  const transport = new StreamableHTTPServerTransport();
  let isConnected = false;

  router.post("/", async (req, res) => {
    try {
      // Connect once on first request
      if (!isConnected) {
        await mcp.connect(transport);
        isConnected = true;
      }
      await transport.handleRequest(req, res);
    } catch (err: any) {
      console.error("MCP transport error:", err?.message || err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32603, message: "Internal error" },
        });
      }
    }
  });

  // GET banner
  router.get("/", (_req, res) => {
    res.status(200).json({
      ok: true,
      transport: "streamable-http",
      server: "zeroheight-mcp",
      message:
        "POST JSON-RPC messages to this endpoint. Tools: list-styleguides, get-styleguide-tree, list-pages, get-page",
    });
  });

  // Health
  router.get("/healthz", (_req, res) => {
    const ok =
      !!process.env.ZEROHEIGHT_CLIENT_ID && !!process.env.ZEROHEIGHT_TOKEN;
    res.status(200).json({
      ok,
      env: {
        ZEROHEIGHT_CLIENT_ID: Boolean(process.env.ZEROHEIGHT_CLIENT_ID),
        ZEROHEIGHT_TOKEN: Boolean(process.env.ZEROHEIGHT_TOKEN),
      },
    });
  });

  return router;
}
