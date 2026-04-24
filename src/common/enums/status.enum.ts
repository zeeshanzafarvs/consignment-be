export enum ConsignmentStatus {
  BOOKED = 'BOOKED',
  DISPATCHED = 'DISPATCHED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PAID = 'PAID',
  TO_PAY = 'TO_PAY',
  PARTIAL = 'PARTIAL',
}

export enum PaymentType {
  BOOKING = 'BOOKING',
  DELIVERY = 'DELIVERY',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK = 'BANK',
  OTHER = 'OTHER',
}

export enum ManifestStatus {
  CREATED = 'CREATED',
  LOADING = 'LOADING',
  DISPATCHED = 'DISPATCHED',
  ARRIVED = 'ARRIVED',
  CLOSED = 'CLOSED',
}

export enum ExpenseType {
  LABOR = 'LABOR',
  FUEL = 'FUEL',
  WAREHOUSE = 'WAREHOUSE',
  VEHICLE = 'VEHICLE',
  OTHER = 'OTHER',
}

export enum CustomerType {
  SENDER = 'SENDER',
  RECEIVER = 'RECEIVER',
  BOTH = 'BOTH',
}

export enum RateType {
  PER_ITEM = 'PER_ITEM',
  PER_KG = 'PER_KG',
}