import type { Request, Response } from "express";
import * as service from "./tickets.service";

const actor = (req: Request) => req.auth!;

export async function list(req: Request, res: Response) {
  const result = await service.listTickets(actor(req), req.query as any);
  res.json(result);
}

export async function stats(req: Request, res: Response) {
  res.json(await service.ticketStats(actor(req)));
}

export async function getOne(req: Request, res: Response) {
  res.json(await service.getTicket(actor(req), req.params.id));
}

export async function create(req: Request, res: Response) {
  const ticket = await service.createTicket(actor(req), req.body);
  res.status(201).json(ticket);
}

export async function updateStatus(req: Request, res: Response) {
  const ticket = await service.updateStatus(
    actor(req),
    req.params.id,
    req.body.status,
    req.body.note
  );
  res.json(ticket);
}

export async function assign(req: Request, res: Response) {
  const ticket = await service.assignTicket(
    actor(req),
    req.params.id,
    req.body.assigneeId
  );
  res.json(ticket);
}

export async function comment(req: Request, res: Response) {
  const created = await service.addComment(
    actor(req),
    req.params.id,
    req.body.body,
    req.body.isInternal
  );
  res.status(201).json(created);
}

export async function rate(req: Request, res: Response) {
  const ticket = await service.rateTicket(
    actor(req),
    req.params.id,
    req.body.rating,
    req.body.ratingComment
  );
  res.json(ticket);
}
