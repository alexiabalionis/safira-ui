import { Router } from "express";

import {
  exportDashboardReports,
  getDashboardOverview,
  listDashboardReports,
} from "../controllers/dashboard.controller";
import { asyncHandler } from "../utils/async-handler";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", asyncHandler(getDashboardOverview));
dashboardRouter.get("/reports", asyncHandler(listDashboardReports));
dashboardRouter.get("/reports/export", asyncHandler(exportDashboardReports));
