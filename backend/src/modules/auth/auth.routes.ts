import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/auth";
import { loginSchema, registerSchema } from "./auth.schema";
import * as controller from "./auth.controller";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  validate({ body: registerSchema }),
  asyncHandler(controller.register)
);
authRoutes.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(controller.login)
);
authRoutes.post("/refresh", asyncHandler(controller.refresh));
authRoutes.post("/logout", asyncHandler(controller.logout));
authRoutes.get("/me", authenticate, asyncHandler(controller.me));
