import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PetModule } from './contexts/pet/pet.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, PetModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
