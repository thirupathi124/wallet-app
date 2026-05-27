import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './transaction.entity';
import { User } from '../users/user.entity';
import { Wallet } from '../wallets/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User, Wallet])],
  providers: [TransactionsService],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
