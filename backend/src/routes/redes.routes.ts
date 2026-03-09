import { Router } from "express";

import { asyncHandler } from "../utils/async-handler";
import {
  createRede,
  deleteRede,
  getRedeById,
  listRedes,
  updateRede,
} from "../controllers/rede.controller";

export const redesRouter = Router();

redesRouter.get("/", asyncHandler(listRedes));
redesRouter.post("/", asyncHandler(createRede));
redesRouter.get("/:id", asyncHandler(getRedeById));
redesRouter.patch("/:id", asyncHandler(updateRede));
redesRouter.delete("/:id", asyncHandler(deleteRede));
