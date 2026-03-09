import type { Request, Response } from "express";

import { importWayCsv } from "../services/way-import.service";
import { importWayCsvSchema } from "../validators/way-import.schema";

export async function importWayCsvController(req: Request, res: Response) {
  const payload = importWayCsvSchema.parse(req.body);
  const result = await importWayCsv(payload.csvContent);
  return res.status(200).json(result);
}
