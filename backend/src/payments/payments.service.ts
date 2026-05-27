import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Wallet } from '../wallets/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from '../transactions/transaction.entity';

@Injectable()
export class PaymentsService {
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') as string,
      { apiVersion: '2024-06-20' },
    );
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') as string;
    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${(err as Error).message}`);
    }
  }

  async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const { walletId, amount } = session.metadata as {
      walletId: string;
      amount: string;
    };

    const wallet = await this.walletRepo.findOne({ where: { id: walletId } });
    if (!wallet) {
      this.logger.error(`Wallet not found for session ${session.id}`);
      return;
    }

    const creditAmount = parseFloat(amount);
    await this.walletRepo.update(wallet.id, {
      balance: () => `balance + ${creditAmount}`,
    });

    const tx = this.transactionRepo.create({
      receiverWalletId: walletId,
      amount: creditAmount,
      type: TransactionType.CREDIT,
      status: TransactionStatus.SUCCESS,
      stripeSessionId: session.id,
      description: `Stripe top-up: $${creditAmount}`,
    });
    await this.transactionRepo.save(tx);

    this.logger.log(`Wallet ${walletId} credited $${creditAmount} via Stripe`);
  }
}
