// Database fixtures for local development.
//
// This script is dev tooling (same category as migrations), so it is allowed to
// use the Prisma client directly — the "no Prisma in domain/" rule applies to
// application runtime code, not to seeding.
//
// All IDs are deterministic so cross-table references stay coherent: pets point
// to a real household, household members link real users to real households, and
// health documents point to real pets. Re-running the script is safe: every
// table is wiped (in FK-dependency order) before re-inserting.
//
// Run with: `pnpm --filter api exec prisma db seed`
//   (also runs automatically after `prisma migrate reset`)

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Species,
  Role,
  DocumentType,
  HouseholdRole,
} from '../generated/prisma/client';

// Wired like PrismaService: Prisma 7 needs an explicit driver adapter.
// On the host the CLI uses DATABASE_URL pointing to localhost:5432.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ── Deterministic identifiers ──────────────────────────────────────
const USER_ALICE = '00000000-0000-4000-8000-000000000001';
const USER_BOB = '00000000-0000-4000-8000-000000000002';
const USER_CAROL = '00000000-0000-4000-8000-000000000003';

const HOUSEHOLD_MARTIN = '10000000-0000-4000-8000-000000000001';
const HOUSEHOLD_DURAND = '10000000-0000-4000-8000-000000000002';

const PET_REX = '20000000-0000-4000-8000-000000000001';
const PET_MIMI = '20000000-0000-4000-8000-000000000002';
const PET_PIXEL = '20000000-0000-4000-8000-000000000003';

const DOC_REX_VACCINATION = '30000000-0000-4000-8000-000000000001';
const DOC_REX_CERTIFICATE = '30000000-0000-4000-8000-000000000002';
const DOC_MIMI_PRESCRIPTION = '30000000-0000-4000-8000-000000000003';
const DOC_PIXEL_LAB = '30000000-0000-4000-8000-000000000004';

// Placeholder hash in bcrypt format. Auth is not implemented yet, so no password
// maps to it; replace with real hashes once the auth context lands.
const PLACEHOLDER_PASSWORD_HASH =
  '$2b$10$0000000000000000000000000000000000000000000000000000';

async function clearAll(): Promise<void> {
  // Delete in reverse dependency order. Only household_members has a real FK
  // (→ households); the rest are referenced by id only, but order stays tidy.
  await prisma.healthDocument.deleteMany();
  await prisma.householdMember.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.household.deleteMany();
  await prisma.user.deleteMany();
}

async function seed(): Promise<void> {
  await prisma.user.createMany({
    data: [
      {
        id: USER_ALICE,
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Martin',
        passwordHash: PLACEHOLDER_PASSWORD_HASH,
        role: Role.ADMIN,
      },
      {
        id: USER_BOB,
        email: 'bob@example.com',
        firstName: 'Bob',
        lastName: 'Martin',
        passwordHash: PLACEHOLDER_PASSWORD_HASH,
        role: Role.USER,
      },
      {
        id: USER_CAROL,
        email: 'carol@example.com',
        firstName: 'Carol',
        lastName: 'Durand',
        passwordHash: PLACEHOLDER_PASSWORD_HASH,
        role: Role.USER,
      },
    ],
  });

  await prisma.household.createMany({
    data: [
      { id: HOUSEHOLD_MARTIN, name: 'Famille Martin' },
      { id: HOUSEHOLD_DURAND, name: 'Coloc Durand' },
    ],
  });

  await prisma.householdMember.createMany({
    data: [
      {
        householdId: HOUSEHOLD_MARTIN,
        userId: USER_ALICE,
        role: HouseholdRole.OWNER,
      },
      {
        householdId: HOUSEHOLD_MARTIN,
        userId: USER_BOB,
        role: HouseholdRole.MEMBER,
      },
      {
        householdId: HOUSEHOLD_DURAND,
        userId: USER_CAROL,
        role: HouseholdRole.OWNER,
      },
    ],
  });

  await prisma.pet.createMany({
    data: [
      {
        id: PET_REX,
        name: 'Rex',
        species: Species.DOG,
        birthDate: new Date('2020-03-15'),
        householdId: HOUSEHOLD_MARTIN,
      },
      {
        id: PET_MIMI,
        name: 'Mimi',
        species: Species.CAT,
        birthDate: new Date('2021-07-22'),
        householdId: HOUSEHOLD_MARTIN,
      },
      {
        id: PET_PIXEL,
        name: 'Pixel',
        species: Species.OTHER,
        birthDate: new Date('2019-11-08'),
        householdId: HOUSEHOLD_DURAND,
      },
    ],
  });

  await prisma.healthDocument.createMany({
    data: [
      {
        id: DOC_REX_VACCINATION,
        petId: PET_REX,
        householdId: HOUSEHOLD_MARTIN,
        driveFileId: 'drive-file-rex-vaccination',
        documentType: DocumentType.VACCINATION,
        documentDate: new Date('2024-01-10'),
      },
      {
        id: DOC_REX_CERTIFICATE,
        petId: PET_REX,
        householdId: HOUSEHOLD_MARTIN,
        driveFileId: 'drive-file-rex-certificate',
        documentType: DocumentType.CERTIFICATE,
        documentDate: new Date('2024-02-05'),
      },
      {
        id: DOC_MIMI_PRESCRIPTION,
        petId: PET_MIMI,
        householdId: HOUSEHOLD_MARTIN,
        driveFileId: 'drive-file-mimi-prescription',
        documentType: DocumentType.PRESCRIPTION,
        documentDate: new Date('2024-03-18'),
      },
      {
        id: DOC_PIXEL_LAB,
        petId: PET_PIXEL,
        householdId: HOUSEHOLD_DURAND,
        driveFileId: 'drive-file-pixel-lab',
        documentType: DocumentType.LAB_RESULT,
        documentDate: new Date('2024-04-22'),
      },
    ],
  });
}

async function main(): Promise<void> {
  await clearAll();
  await seed();

  const counts = {
    users: await prisma.user.count(),
    households: await prisma.household.count(),
    householdMembers: await prisma.householdMember.count(),
    pets: await prisma.pet.count(),
    healthDocuments: await prisma.healthDocument.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
