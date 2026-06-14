import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ code: err.code, message: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ code: "CONFLICT", message: "Registro já existe" });
    }
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Recurso não encontrado" });
    }
  }

  console.error(err);
  // TEMPORÁRIO: expõe o detalhe do erro para diagnóstico do deploy. Remover depois.
  const detail =
    err instanceof Error ? { name: err.name, message: err.message } : undefined;
  return res
    .status(500)
    .json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor", detail });
}
