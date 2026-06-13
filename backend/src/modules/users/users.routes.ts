import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middlewares/validate";
import { authenticate, authorize } from "../../middlewares/auth";
import { hashPassword } from "../../lib/hash";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["REQUESTER", "AGENT", "ADMIN"]).default("REQUESTER"),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
});

const listQuerySchema = z.object({
  role: z.enum(["REQUESTER", "AGENT", "ADMIN", "SUPER_ADMIN"]).optional(),
});

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  jobTitle: true,
  isActive: true,
  createdAt: true,
} as const;

export const userRoutes = Router();
userRoutes.use(authenticate);

// Lista usuários da organização (atendentes para atribuição, etc.).
userRoutes.get(
  "/",
  authorize("AGENT", "ADMIN", "SUPER_ADMIN"),
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const role = (req.query as any).role;
    const items = await prisma.user.findMany({
      where: {
        organizationId: req.auth!.organizationId,
        ...(role ? { role } : {}),
      },
      orderBy: { name: "asc" },
      select: publicSelect,
    });
    res.json(items);
  })
);

// Admin cria novo usuário na organização.
userRoutes.post(
  "/",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate({ body: createUserSchema }),
  asyncHandler(async (req, res) => {
    const passwordHash = await hashPassword(req.body.password);
    const user = await prisma.user.create({
      data: {
        organizationId: req.auth!.organizationId,
        name: req.body.name,
        email: req.body.email,
        passwordHash,
        role: req.body.role,
        department: req.body.department,
        jobTitle: req.body.jobTitle,
      },
      select: publicSelect,
    });
    res.status(201).json(user);
  })
);
