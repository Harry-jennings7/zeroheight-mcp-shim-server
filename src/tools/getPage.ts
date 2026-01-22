// src/tools/getPage.ts
import { Zeroheight } from "../services/zeroheight.js";

let _client: Zeroheight | undefined;
function client(): Zeroheight {
  _client ??= new Zeroheight();
  return _client;
}

export type PageFormat = "markdown" | "json";

export interface GetPageInput {
  styleguideId: string;
  pageId: string;
  format?: PageFormat; // default: 'markdown'
}

/**
 * Gets a single page in the requested format.
 * mcp.ts calls: getPage({ styleguideId, pageId, format })
 */
export async function getPage({
  styleguideId,
  pageId,
  format = "markdown",
}: GetPageInput) {
  const page = await client().getPage(styleguideId, pageId, format);
  return page;
}
