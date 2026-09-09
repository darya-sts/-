import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { PromptModule } from "./prompts/prompt.module";
import { MarvinStudioService } from "./application/marvin-studio.service";
import { DigestPipelineService } from "./application/digest-pipeline.service";
import { TokenLoggingMiddleware } from "./common/token-logging.middleware";
import { ArchitectureController } from "./infrastructure/architecture/architecture.controller";
import { ArchitectureService } from "./infrastructure/architecture/architecture.service";
import { MarvinBotClient } from "./infrastructure/marvin/marvinbot.client";
import { PrismaService } from "./infrastructure/prisma/prisma.service";
import { RedisService } from "./infrastructure/redis/redis.service";
import { MarvinBotController } from "./presentation/marvinbot.controller";

@Module({
  imports: [AuthModule, PromptModule],
  controllers: [MarvinBotController, ArchitectureController],
  providers: [
    PrismaService,
    RedisService,
    MarvinBotClient,
    MarvinStudioService,
    DigestPipelineService,
    ArchitectureService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenLoggingMiddleware).forRoutes("api/marvinbot");
  }
}
