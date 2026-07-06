import type { Pet } from './types';

/** Age split into a unit + value, so the UI can localize the label. */
export interface PetAge {
  unit: 'years' | 'months';
  value: number;
}

/** Age from a birth date: whole years, or months under a year. */
export function petAge(pet: Pet, now: Date = new Date()): PetAge {
  const birth = new Date(pet.birthDate);
  let years = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    years -= 1;
  }
  if (years >= 1) {
    return { unit: 'years', value: years };
  }
  const months = Math.max(
    0,
    monthDelta + 12 * (now.getFullYear() - birth.getFullYear()),
  );
  return { unit: 'months', value: months };
}
