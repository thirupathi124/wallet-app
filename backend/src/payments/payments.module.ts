import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Wallet } from '../wallets/wallet.entity';
import { Transaction } from '../transactions/transaction.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Wallet, Transaction])],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
