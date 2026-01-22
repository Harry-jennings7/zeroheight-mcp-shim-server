// src/server.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createMCPServer } from "./mcp.js"; // <-- note .js

// add auth layer
import { requireSharedSecret } from "./auth.js";

const app = express();
const port = process.env.PORT || 3000;

// IMPORTANT: call the factory and mount the returned router
app.use("/mcp", requireSharedSecret, createMCPServer());

// Echo route for debugging only (doesn't affect /mcp)
app.post("/echo", express.text({ type: "*/*", limit: "256kb" }), (req, res) => {
  res.type("text/plain").send(req.body || "");
});

// Optional: a simple root that proves this server is the one you’re hitting
app.get("/", (_req, res) => res.status(200).send("OK: zeroheight-mcp server"));

app.listen(port, () => {
  console.log(`🚀 Zeroheight MCP Shim running on http://localhost:${port}/mcp`);
});
