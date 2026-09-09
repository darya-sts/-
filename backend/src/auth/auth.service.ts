import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import type { Response, Request } from "express";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../infrastructure/prisma/prisma.service";
import {
  ACCESS_COOKIE,
  ACCESS_TTL_SEC,
  IS_PROD,
  JWT_SECRET,
  REFRESH_COOKIE,
  REFRESH_TTL_SEC,
} from "./auth.constants";
import type { AuthUser } from "./auth.decorators";
import { assertLoginRateLimit } from "./login-rate-limit";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureAdminSeed();
  }

  /** Создаёт admin из env, если пользователя ещё нет. */
  private async ensureAdminSeed() {
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "";
    if (!email || !password) {
      // eslint-disable-next-line no-console
      console.warn("[auth] ADMIN_EMAIL/ADMIN_PASSWORD не заданы — seed пропущен");
      return;
    }
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return;
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.user.create({
      data: { email, passwordHash, role: "admin" },
    });
    // eslint-disable-next-line no-console
    console.log(`[auth] Создан admin: ${email}`);
  }

  private cookieOpts(maxAgeSec: number) {
    return {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax" as const,
      path: "/",
      maxAge: maxAgeSec * 1000,
    };
  }

  private signAccess(user: { id: string; email: string; role: string }): string {
    return jwt.sign(
      { sub: user.id, email: user.email, role: user.role, typ: "access" },
      JWT_SECRET,
      { expiresIn: ACCESS_TTL_SEC },
    );
  }

  private async issueRefresh(userId: string): Promise<string> {
    const raw = randomBytes(48).toString("base64url");
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    return raw;
  }

  private setAuthCookies(res: Response, access: string, refresh: string) {
    res.cookie(ACCESS_COOKIE, access, this.cookieOpts(ACCESS_TTL_SEC));
    res.cookie(REFRESH_COOKIE, refresh, this.cookieOpts(REFRESH_TTL_SEC));
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/" });
  }

  async login(email: string, password: string, req: Request, res: Response) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    try {
      assertLoginRateLimit(`login:${ip}:${email.toLowerCase()}`);
    } catch (e) {
      throw new HttpException(
        e instanceof Error ? e.message : "Too many requests",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const access = this.signAccess(user);
    const refresh = await this.issueRefresh(user.id);
    this.setAuthCookies(res, access, refresh);
    return { id: user.id, email: user.email, role: user.role };
  }

  async refresh(req: Request, res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) throw new UnauthorizedException("Нет refresh-токена");

    const tokenHash = hashToken(raw);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { user: true },
    });
    if (!stored || stored.expiresAt.getTime() < Date.now()) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException("Refresh истёк");
    }

    // Ротация: старый токен отзываем, выдаём новый
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const access = this.signAccess(stored.user);
    const refresh = await this.issueRefresh(stored.user.id);
    this.setAuthCookies(res, access, refresh);
    return {
      id: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
    };
  }

  async logout(req: Request, res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (raw) {
      const tokenHash = hashToken(raw);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.clearAuthCookies(res);
    return { ok: true };
  }

  me(user: AuthUser) {
    return user;
  }
}
