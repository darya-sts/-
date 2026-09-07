import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Post('token')
  @ApiOperation({ summary: 'Получить JWT (single-user)' })
  token(@Body() body: { userId?: string }) {
    const userId = body.userId || this.config.get('DEFAULT_USER_ID') || 'default-user';
    const accessToken = this.jwt.sign({ sub: userId });
    return { accessToken, userId };
  }
}