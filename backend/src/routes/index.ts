import { Router } from "express";

import { authenticate, authorize } from "../middlewares/auth.middleware";
import { authRouter } from "./auth.routes";
import { clientesRouter } from "./clientes.routes";
import { dashboardRouter } from "./dashboard.routes";
import { erpsRouter } from "./erps.routes";
import { importacoesRouter } from "./importacoes.routes";
import { postosRouter } from "./postos.routes";
import { redesRouter } from "./redes.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);

apiRouter.use(
  "/dashboard",
  authenticate(),
  authorize(["admin", "operador", "visitante"]),
  dashboardRouter,
);
apiRouter.use(
  "/postos",
  authenticate(),
  authorize(["admin", "operador"]),
  postosRouter,
);
apiRouter.use(
  "/clientes",
  authenticate(),
  authorize(["admin"]),
  clientesRouter,
);
apiRouter.use("/redes", authenticate(), authorize(["admin"]), redesRouter);
apiRouter.use("/erps", authenticate(), authorize(["admin"]), erpsRouter);
apiRouter.use(
  "/importacoes",
  authenticate(),
  authorize(["admin"]),
  importacoesRouter,
);
