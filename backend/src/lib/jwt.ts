import jwt, { type SignOptions } from "jsonwebtoken";
import { randomBytes } from "crypto";
import { env } from "../config/env";
import type { Role } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string; // user id
  organizationId: string;
  role: Role;
}

export const signAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

// O refresh token é um valor aleatório opaco (não um JWT); guardamos só o hash.
export const generateRefreshToken = () => randomBytes(48).toString("hex");

export const refreshExpiryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + env.JWT_REFRESH_EXPIRES_IN_DAYS);
  return d;
};
