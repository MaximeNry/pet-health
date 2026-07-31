import { Module } from '@nestjs/common';
import { HealthDocumentModule } from '../health-document/health-document.module';
import { PetModule } from '../pet/pet.module';
import { AddMemberUseCase } from './application/add-member.use-case';
import { ChangeMemberRoleUseCase } from './application/change-member-role.use-case';
import { CreateHouseholdUseCase } from './application/create-household.use-case';
import { DeleteHouseholdUseCase } from './application/delete-household.use-case';
import { GetHouseholdUseCase } from './application/get-household.use-case';
import { HouseholdTeardownService } from './application/household-teardown.service';
import { ListHouseholdsByUserUseCase } from './application/list-households-by-user.use-case';
import { RemoveMemberUseCase } from './application/remove-member.use-case';
import { UpdateHouseholdUseCase } from './application/update-household.use-case';
import { HOUSEHOLD_REPOSITORY } from './domain/household.repository';
import { PrismaHouseholdRepository } from './infrastructure/prisma-household.repository';
import { HouseholdController } from './presentation/household.controller';

/**
 * `household` bounded context (supporting). The `HouseholdRepository` port is
 * bound to its Prisma adapter via a token. `PrismaService` is provided globally
 * by `PrismaModule`. The pet and health-document modules are imported so the
 * teardown orchestration can cascade a household deletion through their ports.
 */
@Module({
  imports: [PetModule, HealthDocumentModule],
  controllers: [HouseholdController],
  providers: [
    CreateHouseholdUseCase,
    GetHouseholdUseCase,
    ListHouseholdsByUserUseCase,
    UpdateHouseholdUseCase,
    DeleteHouseholdUseCase,
    HouseholdTeardownService,
    AddMemberUseCase,
    RemoveMemberUseCase,
    ChangeMemberRoleUseCase,
    { provide: HOUSEHOLD_REPOSITORY, useClass: PrismaHouseholdRepository },
  ],
  // `HOUSEHOLD_REPOSITORY` is exported for the invitation accept flow;
  // `HouseholdTeardownService` for the account-deletion flow — both sanctioned
  // crossings between contexts.
  exports: [HOUSEHOLD_REPOSITORY, HouseholdTeardownService],
})
export class HouseholdModule {}
