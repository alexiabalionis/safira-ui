import { Router } from "express";

import { getDashboardOverview } from "../controllers/dashboard.controller";
import { asyncHandler } from "../utils/async-handler";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", asyncHandler(getDashboardOverview));
