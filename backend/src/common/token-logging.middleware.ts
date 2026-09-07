import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class TokenLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("MarvinTokenLog");

  use(req: Request, res: Response, next: NextFunction) {
    const started = Date.now();
    res.on("finish", () => {
      const tokensHeader = res.getHeader("x-tokens-used");
      this.logger.log(
        JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          ms: Date.now() - started,
          tokens: tokensHeader ?? null,
        }),
      );
    });
    next();
  }
}
