import type { Pet, Species } from './types';

/** French label for a domain species. */
export function speciesLabel(species: Species): string {
  switch (species) {
    case 'DOG':
      return 'Chien';
    case 'CAT':
      return 'Chat';
    default:
      return 'Animal';
  }
}

/**
 * Age from a birth date, as a short French label (`« 1 an »` / `« 3 ans »`).
 * Under a year, falls back to months.
 */
export function petAge(pet: Pet, now: Date = new Date()): string {
  const birth = new Date(pet.birthDate);
  let years = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    years -= 1;
  }
  if (years >= 1) {
    return `${years} ${years > 1 ? 'ans' : 'an'}`;
  }
  const months = Math.max(
    0,
    monthDelta + 12 * (now.getFullYear() - birth.getFullYear()),
  );
  return `${months} mois`;
}
