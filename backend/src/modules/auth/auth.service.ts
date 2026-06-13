import { prisma } from "../../config/prisma";
import { hashPassword, verifyPassword, sha256 } from "../../lib/hash";
import {
  generateRefreshToken,
  refreshExpiryDate,
  signAccessToken,
} from "../../lib/jwt";
import { Conflict, Unauthorized } from "../../lib/errors";
import type { RegisterInput, LoginInput } from "./auth.schema";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  language: string;
  theme: string;
  avatarUrl: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    language: user.language,
    theme: user.theme,
    avatarUrl: user.avatarUrl,
  };
}

async function issueTokens(user: {
  id: string;
  organizationId: string;
  role: any;
}, meta: { userAgent?: string; ipAddress?: string }) {
  const accessToken = signAccessToken({
    sub: user.id,
    organizationId: user.organizationId,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: refreshExpiryDate(),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput, meta: { userAgent?: string; ipAddress?: string }) {
  let slug = slugify(input.organizationName) || "org";
  // Garante slug único.
  const exists = await prisma.organization.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now().toString(36)}`;

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "ADMIN",
      organization: {
        create: { name: input.organizationName, slug },
      },
    },
  });

  const tokens = await issueTokens(user, meta);
  return { user: publicUser(user), ...tokens };
}

export async function login(input: LoginInput, meta: { userAgent?: string; ipAddress?: string }) {
  const user = await prisma.user.findFirst({ where: { email: input.email } });
  if (!user || !user.isActive) throw Unauthorized("Credenciais inválidas");

  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) throw Unauthorized("Credenciais inválidas");

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await issueTokens(user, meta);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(rawToken: string | undefined, meta: { userAgent?: string; ipAddress?: string }) {
  if (!rawToken) throw Unauthorized("Refresh token ausente");

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: sha256(rawToken) },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw Unauthorized("Sessão expirada");
  }

  // Rotação: revoga o antigo e emite um novo.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(stored.user, meta);
  return { user: publicUser(stored.user), ...tokens };
}

export async function logout(rawToken: string | undefined) {
  if (!rawToken) return;
  await prisma.refreshToken
    .updateMany({
      where: { tokenHash: sha256(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    })
    .catch(() => undefined);
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Unauthorized();
  return publicUser(user);
}
