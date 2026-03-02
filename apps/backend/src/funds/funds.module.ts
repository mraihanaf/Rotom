import { Module } from '@nestjs/common';
import { FundsController } from './funds.controller';
import { FundsService } from './funds.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [FundsController],
  providers: [FundsService],
  imports: [PrismaModule],
})
export class FundsModule {}
