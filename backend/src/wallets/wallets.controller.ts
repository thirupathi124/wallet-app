import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { AddMoneyDto } from './dto/add-money.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current wallet balance' })
  @ApiResponse({ status: 200, description: 'Returns wallet balance' })
  getBalance(@CurrentUser() user: { id: string }) {
    return this.walletsService.getBalance(user.id);
  }

  @Post('add-money')
  @ApiOperation({ summary: 'Create Stripe Checkout session to add money' })
  @ApiResponse({
    status: 201,
    description: 'Returns Stripe Checkout session URL',
  })
  addMoney(@CurrentUser() user: { id: string }, @Body() dto: AddMoneyDto) {
    return this.walletsService.createCheckoutSession(user.id, dto);
  }
}
