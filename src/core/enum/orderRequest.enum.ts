export enum OrderRequesType {
    CREATE = 'create',
    CANCEL = 'cancel',
}

export enum OrderStatus {
    PENDING_CONFIRM = 1,
    CONFIRMED = 2,
    COMPLETED = 3,
    PENDING_PAYMENT = 4,
    PAYMENT_CONFIRMED = 5,
    CANCELED = 6,
}

export enum PaymentMethod {
    CASH_ON_DELIVERY = 'COD',
    BANKING = 'BANKING',
}

export enum GetAllOrderRequestOrderByEnum {
    CREATED_AT = 'createdAt',
    TOTAL = 'total',
}