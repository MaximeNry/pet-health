/**
 * Building block of the shared kernel: an entity has a stable identity (`id`).
 * Equality is by identity, never by value. Pure TypeScript, with no
 * framework/infra dependency.
 */
export abstract class Entity {
  protected constructor(private readonly _id: string) {}

  get id(): string {
    return this._id;
  }

  equals(other?: Entity): boolean {
    if (other === undefined || other === null) {
      return false;
    }
    if (this === other) {
      return true;
    }
    return this._id === other._id;
  }
}
