import { Controller, Get } from '@nestjs/common';

@Controller('payment')
export class PaymentController {

  @Get('/result')
  getPaymentResult() {
    return 'This is a page which show payment result.';
  }
}
