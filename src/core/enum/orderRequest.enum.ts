export enum OrderRequesType {
  CREATE = 'create',
  CANCEL = 'cancel',
}

export enum OrderStatus {
  PENDING_CONFIRM = 1,
  CONFIRMED = 2,
  PENDING_PAYMENT = 3,
  PAYMENT_CONFIRMED = 4,
  DELIVERING = 5,
  COMPLETED = 6,
  CANCELED = 7,
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'COD',
  BANKING = 'BANKING',
}

export enum GetAllOrderRequestOrderByEnum {
  CREATED_AT = 'createdAt',
  TOTAL = 'total',
}
