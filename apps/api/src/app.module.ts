import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HouseholdModule } from './contexts/household/household.module';
import { PetModule } from './contexts/pet/pet.module';
import { UserModule } from './contexts/user/user.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, PetModule, UserModule, HouseholdModule],
})
export class AppModule {}
