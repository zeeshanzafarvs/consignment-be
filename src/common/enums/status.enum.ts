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

// Helper functions to get display names
export const ConsignmentStatusDisplay = {
  [ConsignmentStatus.BOOKED]: 'Booked',
  [ConsignmentStatus.DISPATCHED]: 'Dispatched',
  [ConsignmentStatus.IN_TRANSIT]: 'In Transit',
  [ConsignmentStatus.ARRIVED]: 'Arrived',
  [ConsignmentStatus.DELIVERED]: 'Delivered',
  [ConsignmentStatus.CANCELLED]: 'Cancelled',
};

export const PaymentStatusDisplay = {
  [PaymentStatus.PAID]: 'Paid',
  [PaymentStatus.TO_PAY]: 'Pending',
  [PaymentStatus.PARTIAL]: 'Partial',
};

export const PaymentTypeDisplay = {
  [PaymentType.BOOKING]: 'Booking',
  [PaymentType.DELIVERY]: 'Delivery',
  [PaymentType.ADJUSTMENT]: 'Adjustment',
};

export const PaymentMethodDisplay = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.BANK]: 'Bank',
  [PaymentMethod.OTHER]: 'Other',
};

export const ManifestStatusDisplay = {
  [ManifestStatus.CREATED]: 'Created',
  [ManifestStatus.DISPATCHED]: 'Dispatched',
  [ManifestStatus.ARRIVED]: 'Arrived',
  [ManifestStatus.CLOSED]: 'Closed',
};

export const ExpenseTypeDisplay = {
  [ExpenseType.LABOR]: 'Labor',
  [ExpenseType.FUEL]: 'Fuel',
  [ExpenseType.WAREHOUSE]: 'Warehouse',
  [ExpenseType.VEHICLE]: 'Vehicle',
  [ExpenseType.OTHER]: 'Other',
};

export const CustomerTypeDisplay = {
  [CustomerType.SENDER]: 'Sender',
  [CustomerType.RECEIVER]: 'Receiver',
  [CustomerType.BOTH]: 'Both',
};

export const RateTypeDisplay = {
  [RateType.PER_ITEM]: 'Per Item',
  [RateType.PER_KG]: 'Per Kg',
};