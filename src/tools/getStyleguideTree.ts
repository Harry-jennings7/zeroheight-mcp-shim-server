// src/tools/getStyleguideTree.ts
import { Zeroheight } from "../services/zeroheight.js";

let _client: Zeroheight | undefined;
function client(): Zeroheight {
  _client ??= new Zeroheight();
  return _client;
}

export interface GetStyleguideTreeInput {
  styleguideId: string;
}

/**
 * Returns the navigation tree for a styleguide.
 * mcp.ts calls: getStyleguideTree({ styleguideId })
 */
export async function getStyleguideTree({
  styleguideId,
}: GetStyleguideTreeInput) {
  const tree = await client().getTree(styleguideId);
  return tree;
}
