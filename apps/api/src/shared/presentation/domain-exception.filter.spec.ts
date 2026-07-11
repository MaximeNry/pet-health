import type { ArgumentsHost } from '@nestjs/common';
import { DomainError, DomainErrorKind } from '../domain/domain-error';
import { DomainExceptionFilter } from './domain-exception.filter';

/** Minimal concrete DomainError to exercise the kind→status mapping. */
class TestError extends DomainError {
  constructor(readonly kind: DomainErrorKind) {
    super('boom');
  }
}

const makeHost = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
};

describe('DomainExceptionFilter', () => {
  const filter = new DomainExceptionFilter();

  it.each<[DomainErrorKind, number]>([
    ['validation', 400],
    ['not-found', 404],
    ['conflict', 409],
    ['forbidden', 403],
    ['gone', 410],
  ])('maps a %s error to HTTP %d', (kind, code) => {
    const { host, status, json } = makeHost();

    filter.catch(new TestError(kind), host);

    expect(status).toHaveBeenCalledWith(code);
    expect(json).toHaveBeenCalledWith({
      statusCode: code,
      error: 'TestError',
      message: 'boom',
    });
  });

  it('serializes the error details when present', () => {
    class DetailedError extends DomainError {
      readonly kind: DomainErrorKind = 'forbidden';
      constructor() {
        super('boom', { invitedEmail: 'a@b.c' });
      }
    }
    const { host, json } = makeHost();

    filter.catch(new DetailedError(), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: 403,
      error: 'DetailedError',
      message: 'boom',
      details: { invitedEmail: 'a@b.c' },
    });
  });
});
