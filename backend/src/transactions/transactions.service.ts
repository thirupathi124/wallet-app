import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Wallet } from '../wallets/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from './transaction.entity';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async transfer(senderId: string, dto: TransferDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero');
    }

    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    if (!sender) throw new NotFoundException('Sender not found');

    if (sender.email === dto.receiverEmail) {
      throw new BadRequestException('You cannot transfer money to yourself');
    }

    const receiver = await this.userRepo.findOne({
      where: { email: dto.receiverEmail },
    });
    if (!receiver) {
      throw new NotFoundException(
        `No user found with email: ${dto.receiverEmail}`,
      );
    }

    const senderWallet = await this.walletRepo.findOne({
      where: { userId: senderId },
    });
    if (!senderWallet) throw new NotFoundException('Sender wallet not found');

    const receiverWallet = await this.walletRepo.findOne({
      where: { userId: receiver.id },
    });
    if (!receiverWallet)
      throw new NotFoundException('Receiver wallet not found');

    if (Number(senderWallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.decrement(
        Wallet,
        { id: senderWallet.id },
        'balance',
        dto.amount,
      );

      await queryRunner.manager.increment(
        Wallet,
        { id: receiverWallet.id },
        'balance',
        dto.amount,
      );

      const debitTx = queryRunner.manager.create(Transaction, {
        senderWalletId: senderWallet.id,
        receiverWalletId: receiverWallet.id,
        amount: dto.amount,
        type: TransactionType.DEBIT,
        status: TransactionStatus.SUCCESS,
        description: `Transfer to ${receiver.name} (${receiver.email})`,
      });

      const creditTx = queryRunner.manager.create(Transaction, {
        senderWalletId: senderWallet.id,
        receiverWalletId: receiverWallet.id,
        amount: dto.amount,
        type: TransactionType.CREDIT,
        status: TransactionStatus.SUCCESS,
        description: `Transfer from ${sender.name} (${sender.email})`,
      });

      const [savedDebit] = await queryRunner.manager.save(Transaction, [
        debitTx,
        creditTx,
      ]);

      await queryRunner.commitTransaction();

      const updatedWallet = await this.walletRepo.findOne({
        where: { id: senderWallet.id },
      });

      return {
        transactionId: savedDebit.id,
        newBalance: updatedWallet ? Number(updatedWallet.balance) : Number(senderWallet.balance) - dto.amount,
        message: `Successfully transferred $${dto.amount} to ${receiver.name}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getHistory(userId: string) {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const transactions = await this.transactionRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.senderWallet', 'senderWallet')
      .leftJoinAndSelect('senderWallet.user', 'senderUser')
      .leftJoinAndSelect('tx.receiverWallet', 'receiverWallet')
      .leftJoinAndSelect('receiverWallet.user', 'receiverUser')
      .where(
        '(tx.senderWalletId = :walletId AND tx.type = :debitType) OR (tx.receiverWalletId = :walletId AND tx.type = :creditType)',
        {
          walletId: wallet.id,
          debitType: TransactionType.DEBIT,
          creditType: TransactionType.CREDIT,
        },
      )
      .orderBy('tx.createdAt', 'DESC')
      .getMany();

    return transactions.map((tx) => {
      const isDebit = tx.type === TransactionType.DEBIT;
      const isCredit = tx.type === TransactionType.CREDIT;

      let otherParty: { name: string; userId: string } | null = null;

      if (isDebit && tx.receiverWallet?.user) {
        otherParty = {
          name: tx.receiverWallet.user.name,
          userId: tx.receiverWallet.user.id,
        };
      } else if (isCredit && tx.senderWallet?.user) {
        otherParty = {
          name: tx.senderWallet.user.name,
          userId: tx.senderWallet.user.id,
        };
      }

      return {
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        status: tx.status,
        description: tx.description,
        stripeSessionId: tx.stripeSessionId,
        otherParty,
        createdAt: tx.createdAt,
      };
    });
  }
}
