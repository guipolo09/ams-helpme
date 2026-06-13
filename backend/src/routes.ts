import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes";
import { ticketRoutes } from "./modules/tickets/tickets.routes";
import { applicationRoutes } from "./modules/applications/applications.routes";
import { categoryRoutes } from "./modules/categories/categories.routes";
import { userRoutes } from "./modules/users/users.routes";

export const router = Router();

router.use("/auth", authRoutes);
router.use("/tickets", ticketRoutes);
router.use("/applications", applicationRoutes);
router.use("/categories", categoryRoutes);
router.use("/users", userRoutes);
