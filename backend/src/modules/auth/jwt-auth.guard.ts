import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // В DEMO_MODE пропускаем для удобства локального запуска
    if (this.config.get('DEMO_MODE') === 'true') return true;

    const req = context.switchToHttp().getRequest();
    const path: string = req.path || '';
    if (path.startsWith('/api/telegram/webhook') || path.startsWith('/api/health')) {
      return true;
    }

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException('Требуется JWT');
    try {
      req.user = this.jwt.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Недействительный JWT');
    }
  }
}