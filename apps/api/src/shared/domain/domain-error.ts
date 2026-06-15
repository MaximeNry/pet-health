/**
 * Domain business error. Independent of any HTTP framework: the presentation
 * layer translates these errors into responses (400/404/...). We distinguish
 * two families via `kind` to enable that mapping without coupling the domain.
 */
export type DomainErrorKind = 'validation' | 'not-found';

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
