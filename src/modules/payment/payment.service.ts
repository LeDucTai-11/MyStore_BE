import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import axios from 'axios';

@Injectable()
export class PaymentService {
  constructor(private readonly configService: ConfigService) {}

  createUrlPayment(req: any, orderId: string, amount: number) {
    let VNP_PARAMS = {};
    let VNP_URL = this.configService.get('VNP_URL');
    const SECRET_KEY = this.configService.get('VNP_HASH_SECRET');
    let ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
    const domain =
      req.headers['origin'] ?? `${req.protocol}://${req.get('host')}`;

    VNP_PARAMS['vnp_Version'] = '2.1.0';
    VNP_PARAMS['vnp_Command'] = 'pay';
    VNP_PARAMS['vnp_TmnCode'] = this.configService.get('VNP_TMNCODE');
    VNP_PARAMS['vnp_Locale'] = 'vn';
    VNP_PARAMS['vnp_CurrCode'] = 'VND';
    VNP_PARAMS['vnp_TxnRef'] = orderId;
    VNP_PARAMS['vnp_OrderInfo'] =
      'Thanh toan giao dich cho don hang:' + orderId;
    VNP_PARAMS['vnp_OrderType'] = 'other';
    VNP_PARAMS['vnp_Amount'] = amount * 100;
    VNP_PARAMS['vnp_IpAddr'] = ipAddr;
    VNP_PARAMS['vnp_CreateDate'] = moment(new Date()).format('YYYYMMDDHHmmss');
    VNP_PARAMS['vnp_ReturnUrl'] = `${domain}/payment/result`;
    VNP_PARAMS['vnp_BankCode'] = 'NCB';

    VNP_PARAMS = this.sortObject(VNP_PARAMS);
    let signData = querystring.stringify(VNP_PARAMS, { encode: false });
    let hmac = crypto.createHmac('sha512', SECRET_KEY);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    VNP_PARAMS['vnp_SecureHash'] = signed;
    VNP_URL += '?' + querystring.stringify(VNP_PARAMS, { encode: false });
    return VNP_URL;
  }

  sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  async queryPayment(req: any, vnpParam: any) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const date = new Date();

    const secretKey = this.configService.get('VNP_HASH_SECRET');
    const vnp_TmnCode = this.configService.get('VNP_TMNCODE');
    const vnp_Api = this.configService.get('VNP_QUERY_API_URL');

    const vnp_TxnRef = vnpParam.vnp_TxnRef;
    const vnp_TransactionDate = vnpParam.vnp_PayDate;

    const vnp_RequestId = moment(date).format('HHmmss');

    const vnp_Version = '2.1.0';
    const vnp_Command = 'querydr';
    const vnp_OrderInfo = vnpParam.vnp_OrderInfo;

    const vnp_IpAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    const currCode = 'VND';
    const vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');

    const data =
      vnp_RequestId +
      '|' +
      vnp_Version +
      '|' +
      vnp_Command +
      '|' +
      vnp_TmnCode +
      '|' +
      vnp_TxnRef +
      '|' +
      vnp_TransactionDate +
      '|' +
      vnp_CreateDate +
      '|' +
      vnp_IpAddr +
      '|' +
      vnp_OrderInfo;

    const hmac = crypto.createHmac('sha512', secretKey);
    const vnp_SecureHash = hmac
      .update(Buffer.from(data, 'utf-8'))
      .digest('hex');

    const dataObj = {
      vnp_RequestId,
      vnp_Version,
      vnp_Command,
      vnp_TmnCode,
      vnp_TxnRef,
      vnp_OrderInfo,
      vnp_TransactionDate,
      vnp_CreateDate,
      vnp_IpAddr,
      vnp_SecureHash,
    };

    try {
      const response = await this.makeVnpayApiRequest(vnp_Api, dataObj);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  async makeVnpayApiRequest(url: string, data: any): Promise<any> {
    try {
      const response = await axios.post(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  }
}
