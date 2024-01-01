import { Process, Processor } from '@nestjs/bull';
import { OrderService } from './order.service';
import { isEmpty } from 'lodash';
import { logger } from 'src/logger';
import { OrderRequestService } from '../order-request/order-request.service';

@Processor('scheduleOrder')
export class OrderConsumer {
  constructor(
    private readonly orderRequestService: OrderRequestService,
    private readonly orderService: OrderService,
  ) {}

  @Process('scheduleQueueOrder')
  async cancelOrderAsync() {
    logger.info('CronJob scheduleQueueCancelOrder start running');
    const needCanceOrders = await this.orderService.getOrderNeedCancel();
    console.log({needCanceOrders});
    
    if (!Array.isArray(needCanceOrders) || isEmpty(needCanceOrders)) return;
    const cancelOrderTasks = needCanceOrders.map(async (x) => {
      try {
        await this.orderRequestService.flowCancelOrder(x);
      } catch (error) {
        logger.error('CronJob Error processing cancel order', { detail: error });
      }
    });
    Promise.allSettled(cancelOrderTasks)
      .then(() => {
        logger.info('CronJob scheduleQueueCancelOrder success');
      })
      .catch((error) => {
        logger.error('CronJob scheduleQueueCancelOrder error', {
          detail: error,
        });
      });
  }
}
