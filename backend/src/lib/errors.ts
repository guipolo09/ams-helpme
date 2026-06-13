export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const NotFound = (msg = "Recurso não encontrado") =>
  new AppError(msg, 404, "NOT_FOUND");

export const Unauthorized = (msg = "Não autenticado") =>
  new AppError(msg, 401, "UNAUTHORIZED");

export const Forbidden = (msg = "Acesso negado") =>
  new AppError(msg, 403, "FORBIDDEN");

export const Conflict = (msg = "Conflito") => new AppError(msg, 409, "CONFLICT");
