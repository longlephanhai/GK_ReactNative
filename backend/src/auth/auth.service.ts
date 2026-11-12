import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface AdminUserPayload {
  username: string;
  role: 'admin';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(username: string, password: string) {
    const expectedUsername =
      this.configService.get<string>('ADMIN_USERNAME') ?? 'admin';
    const expectedPassword =
      this.configService.get<string>('ADMIN_PASSWORD') ?? 'admin123';

    if (
      username.trim() !== expectedUsername ||
      password !== expectedPassword
    ) {
      throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');
    }

    const payload: AdminUserPayload = {
      username: expectedUsername,
      role: 'admin',
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: payload,
    };
  }
}

