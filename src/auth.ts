import type { Request, Response, NextFunction } from "express";

export function requireSharedSecret(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const expected = process.env.SHIM_SHARED_SECRET;
  if (!expected) return next(); // no secret configured; allow (useful in dev)
  const got = req.headers["x-shim-secret"];
  if (typeof got === "string" && got === expected) return next();
  return res.status(401).json({ error: "Unauthorized" });
}
