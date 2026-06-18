import { Module } from '@nestjs/common';
import { PetModule } from './contexts/pet/pet.module';
import { UserModule } from './contexts/user/user.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, PetModule, UserModule],
})
export class AppModule {}
