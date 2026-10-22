import { HealthDocument } from '../../health-document/domain/health-document.entity';
import type { HealthDocumentRepository } from '../../health-document/domain/health-document.repository';
import type { ReminderRepository } from '../../reminder/domain/reminder.repository';
import type { PetRepository } from '../domain/pet.repository';
import { PetTeardownService } from './pet-teardown.service';

const PET_ID = 'pet-1';

const makeDocument = (uploaderUserId: string) =>
  HealthDocument.create({
    petId: PET_ID,
    householdId: 'household-1',
    uploaderUserId,
    documentType: 'VACCINATION',
    title: 'Rabies shot',
    documentDate: new Date('2024-01-01'),
    pages: [
      { storageFileId: 'drive-file-1', mimeType: 'image/jpeg', sizeBytes: 1 },
    ],
  });

function makeDeps() {
  const pets = {
    save: jest.fn(),
    findById: jest.fn(),
    findByHouseholdId: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<PetRepository>;
  const documents = {
    save: jest.fn(),
    findById: jest.fn(),
    findByPetId: jest.fn().mockResolvedValue([]),
    deleteById: jest.fn(),
  } as jest.Mocked<HealthDocumentRepository>;
  const reminders = {
    deleteByPetId: jest.fn(),
  } as unknown as jest.Mocked<ReminderRepository>;
  const service = new PetTeardownService(pets, documents, reminders);
  return { pets, documents, reminders, service };
}

describe('PetTeardownService', () => {
  it("deletes every member's documents, the reminders, then the pet", async () => {
    const { pets, documents, reminders, service } = makeDeps();
    const mine = makeDocument('user-1');
    const otherMembers = makeDocument('user-2');
    documents.findByPetId.mockResolvedValue([mine, otherMembers]);

    await service.execute(PET_ID);

    expect(documents.deleteById.mock.calls).toEqual([
      [mine.id],
      [otherMembers.id],
    ]);
    expect(reminders.deleteByPetId).toHaveBeenCalledWith(PET_ID);
    expect(pets.delete).toHaveBeenCalledWith(PET_ID);
  });

  it('deletes a pet without documents directly', async () => {
    const { pets, documents, service } = makeDeps();

    await service.execute(PET_ID);

    expect(documents.deleteById).not.toHaveBeenCalled();
    expect(pets.delete).toHaveBeenCalledWith(PET_ID);
  });
});
