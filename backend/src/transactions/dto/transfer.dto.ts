import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsPositive, Min } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'jane@example.com', description: 'Receiver email address' })
  @IsEmail()
  receiverEmail: string;

  @ApiProperty({ example: 25.5, description: 'Amount to transfer (must be > 0)' })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;
}
