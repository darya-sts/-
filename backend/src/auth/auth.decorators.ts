import { SetMetadata, createParamDecorator, ExecutionContext } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
/** Эндпоинт доступен без JWT. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export type AuthUser = { id: string; email: string; role: string };

/** Текущий пользователь из request после AuthGuard. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  return req.user as AuthUser;
});
