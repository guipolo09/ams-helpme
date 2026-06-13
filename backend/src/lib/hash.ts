import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const SALT_ROUNDS = 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (hash: string, plain: string) =>
  bcrypt.compare(plain, hash);

// Hash determinístico para guardar/buscar o refresh token no banco.
export const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
