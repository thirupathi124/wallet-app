import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { TransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer money to another user by email' })
  @ApiResponse({ status: 201, description: 'Transfer successful' })
  @ApiResponse({ status: 400, description: 'Validation error or insufficient balance' })
  @ApiResponse({ status: 404, description: 'Receiver not found' })
  transfer(
    @CurrentUser() user: { id: string },
    @Body() dto: TransferDto,
  ) {
    return this.transactionsService.transfer(user.id, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history for current user' })
  @ApiResponse({ status: 200, description: 'Returns list of transactions with other party details' })
  getHistory(@CurrentUser() user: { id: string }) {
    return this.transactionsService.getHistory(user.id);
  }
}
