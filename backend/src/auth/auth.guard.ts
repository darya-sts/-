import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import * as jwt from "jsonwebtoken";
import { ACCESS_COOKIE, JWT_SECRET } from "./auth.constants";
import { IS_PUBLIC_KEY, type AuthUser } from "./auth.decorators";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token =
      req.cookies?.[ACCESS_COOKIE] ||
      (typeof req.headers.authorization === "string" &&
      req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) throw new UnauthorizedException("Требуется вход");

    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        email: string;
        role: string;
        typ?: string;
      };
      if (payload.typ && payload.typ !== "access") {
        throw new UnauthorizedException("Неверный тип токена");
      }
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException("Сессия истекла или недействительна");
    }
  }
}
