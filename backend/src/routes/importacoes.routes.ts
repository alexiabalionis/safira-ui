import { Router } from "express";

import { importWayCsvController } from "../controllers/way-import.controller";
import { asyncHandler } from "../utils/async-handler";

export const importacoesRouter = Router();

importacoesRouter.post("/way-csv", asyncHandler(importWayCsvController));
