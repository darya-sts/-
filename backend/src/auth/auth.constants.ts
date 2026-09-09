/** Константы авторизации Forge Mill. */

export const ACCESS_COOKIE = "fm_access";
export const REFRESH_COOKIE = "fm_refresh";

export const ACCESS_TTL_SEC = Number(process.env.AUTH_ACCESS_TTL_SEC || 15 * 60);
export const REFRESH_TTL_SEC = Number(process.env.AUTH_REFRESH_TTL_SEC || 30 * 24 * 60 * 60);

export const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-only-change-me";

export const IS_PROD = process.env.NODE_ENV === "production";
