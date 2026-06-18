import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PetModule } from './contexts/pet/pet.module';
import { UserModule } from './contexts/user/user.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, PetModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
