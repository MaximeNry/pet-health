import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { HealthDocumentModule } from './contexts/health-document/health-document.module';
import { HouseholdModule } from './contexts/household/household.module';
import { InvitationModule } from './contexts/invitation/invitation.module';
import { PetModule } from './contexts/pet/pet.module';
import { UserModule } from './contexts/user/user.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuthorizationModule,
    PetModule,
    UserModule,
    HouseholdModule,
    InvitationModule,
    HealthDocumentModule,
  ],
})
export class AppModule {}
