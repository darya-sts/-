import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { MarvinStudioService } from "./application/marvin-studio.service";
import { TokenLoggingMiddleware } from "./common/token-logging.middleware";
import { MarvinBotClient } from "./infrastructure/marvin/marvinbot.client";
import { PrismaService } from "./infrastructure/prisma/prisma.service";
import { RedisService } from "./infrastructure/redis/redis.service";
import { MarvinBotController } from "./presentation/marvinbot.controller";

@Module({
  controllers: [MarvinBotController],
  providers: [PrismaService, RedisService, MarvinBotClient, MarvinStudioService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenLoggingMiddleware).forRoutes("api/marvinbot");
  }
}
