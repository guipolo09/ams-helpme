import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middlewares/validate";
import { authenticate, authorize } from "../../middlewares/auth";
import { NotFound } from "../../lib/errors";

const upsertSchema = z.object({
  name: z.string().min(2),
  color: z.string().optional().nullable(),
});
const idParam = z.object({ id: z.string().uuid() });

export const categoryRoutes = Router();
categoryRoutes.use(authenticate);

categoryRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await prisma.category.findMany({
      where: { organizationId: req.auth!.organizationId },
      orderBy: { name: "asc" },
    });
    res.json(items);
  })
);

categoryRoutes.post(
  "/",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate({ body: upsertSchema }),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({
      data: { ...req.body, organizationId: req.auth!.organizationId },
    });
    res.status(201).json(category);
  })
);

categoryRoutes.delete(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, organizationId: req.auth!.organizationId },
    });
    if (!existing) throw NotFound("Categoria não encontrada");
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
