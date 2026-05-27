import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class AddMoneyDto {
  @ApiProperty({ example: 50, description: 'Amount in USD (minimum $1)' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;
}
