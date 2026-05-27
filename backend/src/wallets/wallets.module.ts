import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { Wallet } from './wallet.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Wallet, User])],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService, TypeOrmModule],
})
export class WalletsModule {}
