import { Router } from "express";

import { asyncHandler } from "../utils/async-handler";
import {
  createCliente,
  deleteCliente,
  getClienteById,
  listClientes,
  updateCliente,
} from "../controllers/cliente.controller";

export const clientesRouter = Router();

clientesRouter.get("/", asyncHandler(listClientes));
clientesRouter.post("/", asyncHandler(createCliente));
clientesRouter.get("/:id", asyncHandler(getClienteById));
clientesRouter.patch("/:id", asyncHandler(updateCliente));
clientesRouter.delete("/:id", asyncHandler(deleteCliente));
