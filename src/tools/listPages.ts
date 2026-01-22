// src/tools/listPages.ts
import { Zeroheight } from "../services/zeroheight.js";

let _client: Zeroheight | undefined;
function client(): Zeroheight {
  _client ??= new Zeroheight();
  return _client;
}

export interface ListPagesInput {
  styleguideId: string;
  query?: string;
}

/**
 * Lists or searches pages within a styleguide.
 * mcp.ts calls: listPages({ styleguideId, query })
 */
export async function listPages({ styleguideId, query }: ListPagesInput) {
  const items = await client().listPages(styleguideId, query);
  return items;
}
