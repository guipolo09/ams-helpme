import { z } from "zod";

export const statusEnum = z.enum([
  "ABERTO",
  "EM_ATENDIMENTO",
  "AGUARDANDO_SOLICITANTE",
  "RESOLVIDO",
  "ENCERRADO",
  "CANCELADO",
  "REABERTO",
]);

export const priorityEnum = z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]);

export const createTicketSchema = z.object({
  title: z.string().min(3, "Título muito curto"),
  description: z.string().min(5, "Descrição muito curta"),
  priority: priorityEnum.default("MEDIA"),
  // Sem .uuid(): a existência é garantida pela FK; ids do seed não são UUID.
  applicationId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

export const listTicketsSchema = z.object({
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  applicationId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const updateStatusSchema = z.object({
  status: statusEnum,
  note: z.string().optional(),
});

export const assignSchema = z.object({
  assigneeId: z.string().uuid().nullable(),
});

export const addCommentSchema = z.object({
  body: z.string().min(1, "Comentário vazio"),
  isInternal: z.boolean().default(false),
});

export const rateSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  ratingComment: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ListTicketsInput = z.infer<typeof listTicketsSchema>;
