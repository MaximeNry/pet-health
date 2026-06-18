/**
 * Domain business error. Independent of any HTTP framework: the presentation
 * layer translates these errors into responses (400/404/409/...). We distinguish
 * families via `kind` to enable that mapping without coupling the domain.
 */
export type DomainErrorKind = 'validation' | 'not-found' | 'conflict';

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
