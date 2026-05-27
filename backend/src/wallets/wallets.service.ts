import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Wallet } from './wallet.entity';
import { User } from '../users/user.entity';
import { AddMoneyDto } from './dto/add-money.dto';

@Injectable()
export class WalletsService {
  private readonly stripe: InstanceType<typeof Stripe>;

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') as string,
      { apiVersion: '2024-06-20' },
    );
  }

  async getBalance(userId: string) {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return { walletId: wallet.id, balance: Number(wallet.balance) };
  }

  async createCheckoutSession(userId: string, dto: AddMoneyDto) {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const email = user?.email?.trim();
    if (!user || !email) {
      throw new BadRequestException('Account email is required for checkout');
    }

    const customerId = await this.getOrCreateStripeCustomer(
      userId,
      email,
      user.name,
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Wallet Top-Up' },
            unit_amount: Math.round(dto.amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        walletId: wallet.id,
        userId,
        email,
        amount: dto.amount.toString(),
      },
      success_url: `${frontendUrl}/wallet?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/wallet?payment=cancelled`,
    });

    return { sessionUrl: session.url, sessionId: session.id };
  }

  private async getOrCreateStripeCustomer(
    userId: string,
    email: string,
    name?: string,
  ): Promise<string> {
    const existing = await this.stripe.customers.list({ email, limit: 1 });
    if (existing.data[0]) {
      return existing.data[0].id;
    }

    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });

    return customer.id;
  }
}
