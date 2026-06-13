import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { validate } from "../../middlewares/validate";
import { authenticate, authorize } from "../../middlewares/auth";
import {
  addCommentSchema,
  assignSchema,
  createTicketSchema,
  idParamSchema,
  listTicketsSchema,
  rateSchema,
  updateStatusSchema,
} from "./tickets.schema";
import * as controller from "./tickets.controller";

export const ticketRoutes = Router();

ticketRoutes.use(authenticate);

ticketRoutes.get(
  "/",
  validate({ query: listTicketsSchema }),
  asyncHandler(controller.list)
);
ticketRoutes.get("/stats", asyncHandler(controller.stats));
ticketRoutes.get(
  "/:id",
  validate({ params: idParamSchema }),
  asyncHandler(controller.getOne)
);
ticketRoutes.post(
  "/",
  validate({ body: createTicketSchema }),
  asyncHandler(controller.create)
);
ticketRoutes.patch(
  "/:id/status",
  validate({ params: idParamSchema, body: updateStatusSchema }),
  asyncHandler(controller.updateStatus)
);
ticketRoutes.patch(
  "/:id/assign",
  authorize("AGENT", "ADMIN", "SUPER_ADMIN"),
  validate({ params: idParamSchema, body: assignSchema }),
  asyncHandler(controller.assign)
);
ticketRoutes.post(
  "/:id/comments",
  validate({ params: idParamSchema, body: addCommentSchema }),
  asyncHandler(controller.comment)
);
ticketRoutes.post(
  "/:id/rate",
  validate({ params: idParamSchema, body: rateSchema }),
  asyncHandler(controller.rate)
);
