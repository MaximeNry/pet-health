import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../contexts/user/user.module';
import { ACCESS_TOKEN_TTL } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * `auth` — generic subdomain, kept as a plain NestJS module (no DDD layering).
 * Google is the only login method: the Google strategy resolves the local user
 * (via `UserModule`'s exported use case), and the app issues its own session JWT.
 */
@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: ACCESS_TOKEN_TTL },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    JwtStrategy,
    // Secure by default: every route requires a valid session JWT unless
    // marked `@Public()`.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
