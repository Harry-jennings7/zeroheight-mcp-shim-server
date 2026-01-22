// src/tools/listStyleguides.ts
import { Zeroheight } from "../services/zeroheight.js";

let _client: Zeroheight | undefined;
function client(): Zeroheight {
  _client ??= new Zeroheight();
  return _client;
}

/**
 * Lists styleguides available to the auth token.
 * mcp.ts calls this with no arguments.
 */
export async function listStyleguides() {
  const items = await client().listStyleguides();
  return items;
}
``;
