import { Router } from "express";

import {
  createERP,
  deleteERP,
  getERPById,
  listERPs,
  updateERP,
} from "../controllers/erp.controller";
import { asyncHandler } from "../utils/async-handler";

export const erpsRouter = Router();

erpsRouter.get("/", asyncHandler(listERPs));
erpsRouter.post("/", asyncHandler(createERP));
erpsRouter.get("/:id", asyncHandler(getERPById));
erpsRouter.patch("/:id", asyncHandler(updateERP));
erpsRouter.delete("/:id", asyncHandler(deleteERP));
