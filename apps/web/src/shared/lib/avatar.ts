/**
 * Accent palette cycled by index for avatars (pets and household members).
 * Each entry pairs background/foreground/stroke utilities from the design system.
 */
export const AVATAR_ACCENTS = [
  { chip: 'bg-green-100 text-green-700', tint: 'bg-green-50', stroke: 'text-green-500' },
  { chip: 'bg-coral-100 text-coral-700', tint: 'bg-coral-50', stroke: 'text-coral-500' },
  { chip: 'bg-stone-200 text-stone-700', tint: 'bg-stone-100', stroke: 'text-stone-600' },
] as const;

export function accentAt(index: number) {
  return AVATAR_ACCENTS[index % AVATAR_ACCENTS.length];
}
