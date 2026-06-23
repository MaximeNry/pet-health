import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { type JwtPayload } from './auth.constants';

describe('AuthService', () => {
  it('issues a JWT carrying the user id (sub) and email', () => {
    const jwt = new JwtService({ secret: 'test-secret' });
    const service = new AuthService(jwt);

    const token = service.issueAccessToken({
      id: 'u1',
      email: 'a@example.com',
    });
    const decoded = jwt.verify<JwtPayload>(token, { secret: 'test-secret' });

    expect(decoded.sub).toBe('u1');
    expect(decoded.email).toBe('a@example.com');
  });
});
