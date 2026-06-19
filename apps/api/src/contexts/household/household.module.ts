import { Module } from '@nestjs/common';
import { AddMemberUseCase } from './application/add-member.use-case';
import { ChangeMemberRoleUseCase } from './application/change-member-role.use-case';
import { CreateHouseholdUseCase } from './application/create-household.use-case';
import { DeleteHouseholdUseCase } from './application/delete-household.use-case';
import { GetHouseholdUseCase } from './application/get-household.use-case';
import { ListHouseholdsByUserUseCase } from './application/list-households-by-user.use-case';
import { RemoveMemberUseCase } from './application/remove-member.use-case';
import { RenameHouseholdUseCase } from './application/rename-household.use-case';
import { HOUSEHOLD_REPOSITORY } from './domain/household.repository';
import { PrismaHouseholdRepository } from './infrastructure/prisma-household.repository';
import { HouseholdController } from './presentation/household.controller';

/**
 * `household` bounded context (supporting). The `HouseholdRepository` port is
 * bound to its Prisma adapter via a token. `PrismaService` is provided globally
 * by `PrismaModule`.
 */
@Module({
  controllers: [HouseholdController],
  providers: [
    CreateHouseholdUseCase,
    GetHouseholdUseCase,
    ListHouseholdsByUserUseCase,
    RenameHouseholdUseCase,
    DeleteHouseholdUseCase,
    AddMemberUseCase,
    RemoveMemberUseCase,
    ChangeMemberRoleUseCase,
    { provide: HOUSEHOLD_REPOSITORY, useClass: PrismaHouseholdRepository },
  ],
})
export class HouseholdModule {}
