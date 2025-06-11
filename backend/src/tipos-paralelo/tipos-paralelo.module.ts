import { Module } from '@nestjs/common';
import { TiposParaleloController } from './tipos-paralelo.controller';
import { TiposParaleloService } from './tipos-paralelo.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TiposParaleloController],
  providers: [TiposParaleloService],
})
export class TiposParaleloModule {}
