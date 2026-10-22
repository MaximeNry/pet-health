/** NestJS injection token for the port (interfaces don't exist at runtime). */
export const PET_DIRECTORY = 'ReminderPetDirectory';

/**
 * What the reminder context needs to know about a pet, and nothing more: the
 * household it belongs to (denormalized on the reminder for the dashboard
 * query). An anti-corruption port rather than an import of the pet context,
 * so `reminder` never depends on `pet` — which lets the pet context depend on
 * `reminder` to cascade a pet deletion.
 */
export interface PetDirectory {
  /** The pet's household id, or `null` when the pet does not exist. */
  findHouseholdIdOfPet(petId: string): Promise<string | null>;
}
