import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type JwtPayload } from './auth.constants';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  /** Issues the app session JWT for an authenticated user. */
  issueAccessToken(user: { id: string; email: string }): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.sign(payload);
  }
}
