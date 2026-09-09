import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { existsSync, mkdirSync } from "fs";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const uploadDir = process.env.MARVIN_UPLOAD_DIR || "/data/uploads";
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(uploadDir, { prefix: "/api/marvinbot/uploads" });

  // Keep cwd-relative fallback for local/dev without /data
  const localUploads = join(process.cwd(), "uploads");
  if (uploadDir !== localUploads && existsSync(localUploads)) {
    app.useStaticAssets(localUploads, { prefix: "/api/marvinbot/uploads" });
  }

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`MarvinBot Studio API on :${port}`);
}

bootstrap();
