import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { User } from './users/user.entity';
import { Wallet } from './wallets/wallet.entity';
import { Transaction } from './transactions/transaction.entity';
import { RefreshToken } from './auth/refresh-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DATABASE_HOST') ?? '';
        const isLocalHost =
          host === 'localhost' || host === '127.0.0.1';

        return {
          type: 'postgres',
          host,
          port: config.get<number>('DATABASE_PORT'),
          username: config.get<string>('DATABASE_USER'),
          password: config.get<string>('DATABASE_PASSWORD'),
          database: config.get<string>('DATABASE_NAME'),
          entities: [User, Wallet, Transaction, RefreshToken],
          synchronize: true,
          logging: false,
          ssl: isLocalHost ? false : { rejectUnauthorized: false },
        };
      },
    }),
    AuthModule,
    UsersModule,
    WalletsModule,
    PaymentsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
