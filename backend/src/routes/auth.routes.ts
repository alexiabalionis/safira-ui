import { Router } from "express";

import {
  changePassword,
  createUser,
  listUsers,
  login,
  logout,
  me,
  resetUserPassword,
  updateUserRole,
  updateUserStatus,
} from "../controllers/auth.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(login));
authRouter.post(
  "/logout",
  authenticate({ allowForcePasswordChange: true }),
  asyncHandler(logout),
);
authRouter.get(
  "/me",
  authenticate({ allowForcePasswordChange: true }),
  asyncHandler(me),
);
authRouter.post(
  "/change-password",
  authenticate({ allowForcePasswordChange: true }),
  asyncHandler(changePassword),
);
authRouter.post(
  "/users",
  authenticate(),
  authorize(["admin"]),
  asyncHandler(createUser),
);
authRouter.get(
  "/users",
  authenticate(),
  authorize(["admin"]),
  asyncHandler(listUsers),
);
authRouter.patch(
  "/users/:id/status",
  authenticate(),
  authorize(["admin"]),
  asyncHandler(updateUserStatus),
);
authRouter.post(
  "/users/:id/reset-password",
  authenticate(),
  authorize(["admin"]),
  asyncHandler(resetUserPassword),
);
authRouter.patch(
  "/users/:id/role",
  authenticate(),
  authorize(["admin"]),
  asyncHandler(updateUserRole),
);
