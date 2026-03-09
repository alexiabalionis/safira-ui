import { Router } from "express";

import { asyncHandler } from "../utils/async-handler";
import {
  createPosto,
  deletePosto,
  getPostoById,
  listPostos,
  updatePosto,
} from "../controllers/posto.controller";

export const postosRouter = Router();

postosRouter.get("/", asyncHandler(listPostos));
postosRouter.post("/", asyncHandler(createPosto));
postosRouter.get("/:id", asyncHandler(getPostoById));
postosRouter.patch("/:id", asyncHandler(updatePosto));
postosRouter.delete("/:id", asyncHandler(deletePosto));
