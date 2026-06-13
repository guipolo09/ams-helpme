import type { Request, Response } from "express";
import { env } from "../../config/env";
import * as authService from "./auth.service";

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}

const meta = (req: Request) => ({
  userAgent: req.headers["user-agent"],
  ipAddress: req.ip,
});

export async function register(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.register(
    req.body,
    meta(req)
  );
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.login(
    req.body,
    meta(req)
  );
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
}

export async function refresh(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.refresh(
    req.cookies?.refreshToken,
    meta(req)
  );
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req.cookies?.refreshToken);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await authService.me(req.auth!.userId);
  res.json({ user });
}
