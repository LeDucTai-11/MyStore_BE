import { IsNotEmpty, IsOptional } from 'class-validator';

export class PaymentConfirmDto {
  @IsNotEmpty()
  amount: number;

  @IsOptional()
  bankCode?: string;

  @IsNotEmpty()
  transactionNumber: string;

  @IsOptional()
  cardType?: string;

  @IsNotEmpty()
  orderInfo: string;
}
