import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { signAsync: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    jwtService = { signAsync: jest.fn().mockResolvedValue('mock-jwt-token') };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'ADMIN_USERNAME') return 'admin';
        if (key === 'ADMIN_PASSWORD') return 'admin123';
        return undefined;
      }),
    };
    service = new AuthService(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('should return access_token and admin user for valid credentials', async () => {
    const res = await service.login('admin', 'admin123');
    expect(res).toEqual({
      access_token: 'mock-jwt-token',
      user: { username: 'admin', role: 'admin' },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      username: 'admin',
      role: 'admin',
    });
  });

  it('should throw UnauthorizedException for invalid credentials', async () => {
    await expect(service.login('admin', 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
