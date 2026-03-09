import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  return res.status(404).json({ message: "Route not found" });
};
