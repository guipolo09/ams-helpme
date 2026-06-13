import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middlewares/validate";
import { authenticate, authorize } from "../../middlewares/auth";
import { NotFound } from "../../lib/errors";

const upsertSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
const idParam = z.object({ id: z.string().uuid() });

export const applicationRoutes = Router();
applicationRoutes.use(authenticate);

applicationRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await prisma.application.findMany({
      where: { organizationId: req.auth!.organizationId },
      orderBy: { name: "asc" },
    });
    res.json(items);
  })
);

applicationRoutes.post(
  "/",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate({ body: upsertSchema }),
  asyncHandler(async (req, res) => {
    const app = await prisma.application.create({
      data: { ...req.body, organizationId: req.auth!.organizationId },
    });
    res.status(201).json(app);
  })
);

applicationRoutes.put(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate({ params: idParam, body: upsertSchema }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.application.findFirst({
      where: { id: req.params.id, organizationId: req.auth!.organizationId },
    });
    if (!existing) throw NotFound("Aplicação não encontrada");
    const app = await prisma.application.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(app);
  })
);
