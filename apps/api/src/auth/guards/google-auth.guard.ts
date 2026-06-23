import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Triggers the Google OAuth flow (redirect, then callback). */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
