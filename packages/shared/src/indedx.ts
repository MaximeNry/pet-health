export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  birthDate: string; // ISO 8601
}