import {
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DeleteAccountUseCase } from '../contexts/user/application/delete-account.use-case';
import { DomainExceptionFilter } from '../shared/presentation/domain-exception.filter';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_MS,
  type AuthenticatedUser,
} from './auth.constants';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard, safeReturnPath } from './guards/google-auth.guard';

@Controller('auth')
@UseFilters(DomainExceptionFilter)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly deleteAccount: DeleteAccountUseCase,
  ) {}

  /** Starts the Google OAuth flow. The guard performs the redirect. */
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  login(): void {}

  /**
   * Google redirects here. `req.user` is the resolved local user (set by the
   * Google strategy); we mint the app session JWT into an httpOnly cookie and
   * send the browser back to the frontend.
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  callback(@Req() req: Request, @Res() res: Response): void {
    const user = req.user as { id: string; email: string };
    const token = this.auth.issueAccessToken(user);

    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    // Google echoes our OAuth `state` back: it carries the sanitized path the
    // flow started from (e.g. an invitation link) — see GoogleAuthGuard.
    const returnTo = safeReturnPath(req.query.state) ?? '/';
    res.redirect(
      `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}${returnTo}`,
    );
  }

  /** Returns the currently authenticated user. Protected by the global guard. */
  @Get('me')
  me(@Req() req: Request): AuthenticatedUser {
    return req.user as AuthenticatedUser;
  }

  /** Clears the session cookie. */
  @Public()
  @Post('logout')
  logout(@Res() res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.status(200).json({ success: true });
  }

  /**
   * Deletes the signed-in user's account and its data (see
   * `DeleteAccountUseCase` for the exact semantics), then ends the session.
   */
  @Delete('me')
  async removeMe(@Req() req: Request, @Res() res: Response): Promise<void> {
    const user = req.user as AuthenticatedUser;
    await this.deleteAccount.execute(user.userId);
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.status(204).send();
  }
}
