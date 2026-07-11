/**
 * Domain business error. Independent of any HTTP framework: the presentation
 * layer translates these errors into responses (400/404/409/...). We distinguish
 * families via `kind` to enable that mapping without coupling the domain.
 */
export type DomainErrorKind =
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'forbidden'
  | 'gone';

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  /**
   * Optional machine-readable context (e.g. the email an invitation was issued
   * for). Serialized into the HTTP error body so clients don't parse messages.
   */
  readonly details?: Record<string, unknown>;

  protected constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}
