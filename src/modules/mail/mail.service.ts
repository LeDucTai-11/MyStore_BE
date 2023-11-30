import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { VoucherType } from 'src/core/enum/voucher.enum';

@Injectable()
export class MailService {
  constructor(private mailService: MailerService) {}

  async sendResetPasswordMail(email: string, resetPasswordToken: string) {
    await this.mailService.sendMail({
      to: email,
      subject: 'Reset Password Token',
      template: './reset-password',
      context: {
        resetPasswordToken: resetPasswordToken,
      },
    });
  }

  async sendOrderDetails(email: string, data: any) {
    let voucherValue = null;
    if (data.voucher) {
      if (data.voucher.type === VoucherType.FIXED) {
        voucherValue = data.voucher.discountValue;
      } else if (data.voucher.type === VoucherType.PERCENTAGE) {
        voucherValue = (data.total * data.voucher.discountValue) / 100;
      }
    }
    await this.mailService.sendMail({
      to: email,
      subject: 'Send Information Order',
      template: './order-details',
      context: {
        data: {
          ...data,
          voucherValue: voucherValue ? voucherValue : undefined,
          totalPrices: voucherValue
            ? data.total + data.shipping - voucherValue
            : data.total + data.shipping,
        },
      },
    });
  }
}
