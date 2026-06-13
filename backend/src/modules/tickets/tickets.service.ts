import type { Prisma, Role, TicketStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { Forbidden, NotFound } from "../../lib/errors";

interface Actor {
  userId: string;
  organizationId: string;
  role: Role;
}

const isStaff = (role: Role) => role !== "REQUESTER";

const ticketDetailInclude = {
  application: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, color: true } },
  requester: { select: { id: true, name: true, email: true } },
  assignee: { select: { id: true, name: true, email: true } },
  comments: {
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, role: true } } },
  },
  statusHistory: {
    orderBy: { createdAt: "asc" },
    include: { changedBy: { select: { id: true, name: true } } },
  },
} satisfies Prisma.TicketInclude;

export async function listTickets(
  actor: Actor,
  filters: {
    status?: TicketStatus;
    priority?: any;
    applicationId?: string;
    search?: string;
    page: number;
    pageSize: number;
  }
) {
  const where: Prisma.TicketWhereInput = {
    organizationId: actor.organizationId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.applicationId ? { applicationId: filters.applicationId } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    // Solicitante só enxerga os próprios chamados.
    ...(isStaff(actor.role) ? {} : { requesterId: actor.userId }),
  };

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        application: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        requester: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { items, total, page: filters.page, pageSize: filters.pageSize };
}

async function getOwnedTicket(actor: Actor, id: string) {
  const ticket = await prisma.ticket.findFirst({
    where: { id, organizationId: actor.organizationId },
  });
  if (!ticket) throw NotFound("Chamado não encontrado");
  if (!isStaff(actor.role) && ticket.requesterId !== actor.userId) {
    throw Forbidden();
  }
  return ticket;
}

export async function getTicket(actor: Actor, id: string) {
  await getOwnedTicket(actor, id);
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: ticketDetailInclude,
  });
  if (!ticket) throw NotFound("Chamado não encontrado");
  // Solicitante não vê comentários internos.
  if (!isStaff(actor.role)) {
    ticket.comments = ticket.comments.filter((c) => !c.isInternal);
  }
  return ticket;
}

export async function createTicket(
  actor: Actor,
  input: {
    title: string;
    description: string;
    priority: any;
    applicationId?: string | null;
    categoryId?: string | null;
  }
) {
  return prisma.$transaction(async (tx) => {
    const last = await tx.ticket.findFirst({
      where: { organizationId: actor.organizationId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const number = (last?.number ?? 0) + 1;

    return tx.ticket.create({
      data: {
        organizationId: actor.organizationId,
        number,
        title: input.title,
        description: input.description,
        priority: input.priority,
        applicationId: input.applicationId ?? null,
        categoryId: input.categoryId ?? null,
        requesterId: actor.userId,
        statusHistory: {
          create: {
            changedById: actor.userId,
            toStatus: "ABERTO",
            note: "Chamado aberto",
          },
        },
      },
      include: ticketDetailInclude,
    });
  });
}

export async function updateStatus(
  actor: Actor,
  id: string,
  status: TicketStatus,
  note?: string
) {
  const ticket = await getOwnedTicket(actor, id);

  // Solicitante só pode cancelar ou reabrir o próprio chamado.
  if (!isStaff(actor.role) && !["CANCELADO", "REABERTO"].includes(status)) {
    throw Forbidden("Você não pode alterar este chamado para esse status");
  }

  const timestamps: Prisma.TicketUpdateInput = {};
  if (status === "RESOLVIDO") timestamps.resolvedAt = new Date();
  if (status === "ENCERRADO") timestamps.closedAt = new Date();
  if (status === "EM_ATENDIMENTO" && !ticket.firstResponseAt) {
    timestamps.firstResponseAt = new Date();
  }

  return prisma.ticket.update({
    where: { id },
    data: {
      status,
      ...timestamps,
      statusHistory: {
        create: {
          changedById: actor.userId,
          fromStatus: ticket.status,
          toStatus: status,
          note,
        },
      },
    },
    include: ticketDetailInclude,
  });
}

export async function assignTicket(actor: Actor, id: string, assigneeId: string | null) {
  await getOwnedTicket(actor, id);

  if (assigneeId) {
    const assignee = await prisma.user.findFirst({
      where: { id: assigneeId, organizationId: actor.organizationId },
    });
    if (!assignee) throw NotFound("Atendente não encontrado");
  }

  return prisma.ticket.update({
    where: { id },
    data: { assigneeId },
    include: ticketDetailInclude,
  });
}

export async function addComment(
  actor: Actor,
  id: string,
  body: string,
  isInternal: boolean
) {
  await getOwnedTicket(actor, id);

  // Solicitante não cria nota interna.
  const internal = isStaff(actor.role) ? isInternal : false;

  return prisma.ticketComment.create({
    data: { ticketId: id, authorId: actor.userId, body, isInternal: internal },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
}

export async function rateTicket(
  actor: Actor,
  id: string,
  rating: number,
  ratingComment?: string
) {
  const ticket = await getOwnedTicket(actor, id);
  if (ticket.requesterId !== actor.userId) {
    throw Forbidden("Apenas o solicitante pode avaliar");
  }
  return prisma.ticket.update({
    where: { id },
    data: { rating, ratingComment },
    include: ticketDetailInclude,
  });
}

export async function ticketStats(actor: Actor) {
  const where: Prisma.TicketWhereInput = {
    organizationId: actor.organizationId,
    ...(isStaff(actor.role) ? {} : { requesterId: actor.userId }),
  };
  const grouped = await prisma.ticket.groupBy({
    by: ["status"],
    where,
    _count: true,
  });
  const total = grouped.reduce((sum, g) => sum + g._count, 0);
  return {
    total,
    byStatus: Object.fromEntries(grouped.map((g) => [g.status, g._count])),
  };
}
