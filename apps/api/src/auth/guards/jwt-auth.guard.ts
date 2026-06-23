import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protects routes: requires a valid app session JWT (from the cookie). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
