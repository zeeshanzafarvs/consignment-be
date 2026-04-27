# Consignment Management System API

A comprehensive NestJS-based backend for managing consignments, dispatch manifests, payments, and reports for a transport/logistics company.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Common Response Format](#common-response-format)
- [API Endpoints](#api-endpoints)
  - [Auth](#auth)
  - [Users](#users)
  - [Cities](#cities)
  - [Branches](#branches)
  - [Item Types](#item-types)
  - [Customers](#customers)
  - [Rate Lists](#rate-lists)
  - [Consignments](#consignments)
  - [Vehicles](#vehicles)
  - [Drivers](#drivers)
  - [Dispatch Manifests](#dispatch-manifests)
  - [Payments](#payments)
  - [Expenses](#expenses)
  - [Dashboard](#dashboard)
  - [Reports](#reports)
- [Frontend TypeScript Types](#frontend-typescript-types)

---

## Overview

This system manages the complete lifecycle of consignments from booking to delivery, including:
- Consignment booking with automatic rate calculation
- Manifest creation and dispatch management
- Payment tracking and status management
- Branch-level access control
- Comprehensive reporting

---

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

---

## Installation

```bash
# Install dependencies
npm install

# Run database migrations (auto via synchronize in development)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=consignment_db

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=1d

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Trust Proxy
TRUST_PROXY=1
```

---

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Login Endpoint

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "admin@transport.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "System Admin",
      "email": "admin@transport.com",
      "role": "ADMIN",
      "branchId": null
    }
  }
}
```

**Get Current User:**

**GET** `/auth/me` (Requires Authentication)

---

## Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [ ... ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ] // Optional validation errors
}
```

---

## API Endpoints

### Auth

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| POST | `/auth/login` | Login user | No | Public |
| GET | `/auth/me` | Get current user | Yes | All |

---

### Users

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/users` | Get all users | Yes | ADMIN |
| GET | `/users/:id` | Get user by ID | Yes | All |
| PATCH | `/users/:id` | Update user | Yes | All (self) |
| DELETE | `/users/:id` | Delete user | Yes | ADMIN |

**DTOs:**
- `UpdateUserDto`: `{ name?: string, branchId?: string, role?: UserRole }`

---

### Cities

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/cities?page=1&limit=10&search=` | Get all cities (paginated) | Yes | All |
| GET | `/cities/:id` | Get city by ID | Yes | All |
| POST | `/cities` | Create city | Yes | ADMIN |
| PATCH | `/cities/:id` | Update city | Yes | ADMIN |
| DELETE | `/cities/:id` | Delete city | Yes | ADMIN |

**DTOs:**
- `CreateCityDto`: `{ name: string }`
- `UpdateCityDto`: `{ name?: string }`

---

### Branches

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/branches` | Get all branches | Yes | All |
| GET | `/branches/:id` | Get branch by ID | Yes | All |
| POST | `/branches` | Create branch | Yes | ADMIN, MANAGER |
| PATCH | `/branches/:id` | Update branch | Yes | ADMIN, MANAGER |
| DELETE | `/branches/:id` | Delete branch | Yes | ADMIN |

**DTOs:**
- `CreateBranchDto`: `{ name: string, address?: string, cityId?: string, contact?: string }`
- `UpdateBranchDto`: `{ name?: string, address?: string, cityId?: string, contact?: string }`

---

### Item Types

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/item-types` | Get all item types | Yes | All |
| GET | `/item-types/:id` | Get item type by ID | Yes | All |
| POST | `/item-types` | Create item type | Yes | ADMIN, MANAGER |
| PATCH | `/item-types/:id` | Update item type | Yes | ADMIN, MANAGER |
| DELETE | `/item-types/:id` | Delete item type | Yes | ADMIN |

**DTOs:**
- `CreateItemTypeDto`: `{ name: string }`
- `UpdateItemTypeDto`: `{ name?: string }`

---

### Customers

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/customers` | Get all customers | Yes | All |
| GET | `/customers/:id` | Get customer by ID | Yes | All |
| POST | `/customers` | Create customer | Yes | ADMIN, MANAGER, SITE_OFFICER |
| PATCH | `/customers/:id` | Update customer | Yes | ADMIN, MANAGER, SITE_OFFICER |
| DELETE | `/customers/:id` | Delete customer | Yes | ADMIN, MANAGER |

**DTOs:**
- `CreateCustomerDto`: `{ name: string, email?: string, phone: string, address?: string, cityId?: string }`
- `UpdateCustomerDto`: `{ name?: string, email?: string, phone?: string, address?: string, cityId?: string }`

---

### Rate Lists

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/rate-lists?page=1&limit=10&fromCityId=&toCityId=&itemTypeId=&active=` | Get all rate lists (paginated) | Yes | All |
| GET | `/rate-lists/calculate?fromCityId=&toCityId=&itemTypeId=&quantity=1&weight=` | Calculate fare | Yes | All |
| GET | `/rate-lists/:id` | Get rate list by ID | Yes | All |
| POST | `/rate-lists` | Create rate list | Yes | ADMIN, MANAGER |
| PATCH | `/rate-lists/:id` | Update rate list | Yes | ADMIN, MANAGER |
| DELETE | `/rate-lists/:id` | Delete rate list | Yes | ADMIN, MANAGER |

**DTOs:**
- `CreateRateListDto`: `{ fromCityId: string, toCityId: string, itemTypeId: string, rateType?: RateType, rate: number, defaultLabor?: number, defaultLoading?: number, defaultUnloading?: number, defaultWarehouse?: number, active?: boolean }`
- `UpdateRateListDto`: Same fields as Create, all optional

**Rate Calculation Response:**
```json
{
  "success": true,
  "message": "Fare calculated successfully",
  "data": {
    "fare": 500,
    "labor": 50,
    "loading": 50,
    "unloading": 50,
    "warehouse": 0,
    "misc": 0,
    "stTax": 0,
    "ttTax": 0,
    "totalAmount": 650
  }
}
```

---

### Consignments

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/consignments?page=1&limit=10&status=&paymentStatus=&fromCityId=&toCityId=&fromBranchId=&toBranchId=&dateFrom=&dateTo=&search=&biltyNumber=` | Get all consignments (paginated) | Yes | All |
| GET | `/consignments/by-bilty/:biltyNumber` | Get by bilty number | Yes | All |
| GET | `/consignments/:id` | Get by ID | Yes | All |
| POST | `/consignments` | Create consignment | Yes | ADMIN, MANAGER, SITE_OFFICER |
| PATCH | `/consignments/:id` | Update consignment | Yes | ADMIN, MANAGER, SITE_OFFICER |
| PATCH | `/consignments/:id/cancel` | Cancel consignment | Yes | ADMIN, MANAGER |
| POST | `/consignments/:id/deliver` | Deliver consignment | Yes | ADMIN, MANAGER, SITE_OFFICER |
| GET | `/consignments/delivery/search?biltyNumber=&receiverPhone=` | Search for delivery | Yes | All |

**DTOs:**

**CreateConsignmentDto:**
```typescript
{
  sender: {
    name: string;
    phone: string;
    cnic?: string;
    cityId?: string;
  };
  receiver: {
    name: string;
    phone: string;
    cnic?: string;
    cityId?: string;
  };
  fromBranchId: string;
  toBranchId: string;
  fromCityId: string;
  toCityId: string;
  itemTypeId: string;
  quantity: number;
  weight?: number;
  goodsDescription: string;
  charges: {
    fare: number;
    loading?: number;
    unloading?: number;
    labor?: number;
    warehouse?: number;
    misc?: number;
    stTax?: number;
    ttTax?: number;
  };
  payment?: {
    paymentStatus?: PaymentStatus;
    paidAmount?: number;
    method?: PaymentMethod;
  };
}
```

**UpdateConsignmentDto:**
```typescript
{
  goodsDescription?: string;
  quantity?: number;
  weight?: number;
  charges?: {
    fare?: number;
    loading?: number;
    unloading?: number;
    labor?: number;
    warehouse?: number;
    misc?: number;
    stTax?: number;
    ttTax?: number;
  };
  payment?: {
    paidAmount?: number;
    method?: PaymentMethod;
  };
}
```

**DeliverConsignmentDto:**
```typescript
{
  warehouse?: number;
  labor?: number;
  misc?: number;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  receiverName?: string;
  remarks?: string;
}
```

**Consignment Status Flow:**
```
BOOKED → IN_TRANSIT (via manifest dispatch) → ARRIVED (via manifest arrive) → DELIVERED
```

---

### Vehicles

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/vehicles` | Get all vehicles | Yes | All |
| GET | `/vehicles/available` | Get available vehicles | Yes | All |
| GET | `/vehicles/:id` | Get vehicle by ID | Yes | All |
| POST | `/vehicles` | Create vehicle | Yes | ADMIN, MANAGER |
| PATCH | `/vehicles/:id` | Update vehicle | Yes | ADMIN, MANAGER |
| DELETE | `/vehicles/:id` | Delete vehicle | Yes | ADMIN |

**DTOs:**
- `CreateVehicleDto`: `{ numberPlate: string, type?: string, isAvailable?: boolean }`
- `UpdateVehicleDto`: `{ numberPlate?: string, type?: string, isAvailable?: boolean }`

---

### Drivers

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/drivers` | Get all drivers | Yes | All |
| GET | `/drivers/:id` | Get driver by ID | Yes | All |
| POST | `/drivers` | Create driver | Yes | ADMIN, MANAGER |
| PATCH | `/drivers/:id` | Update driver | Yes | ADMIN, MANAGER |
| DELETE | `/drivers/:id` | Delete driver | Yes | ADMIN |

**DTOs:**
- `CreateDriverDto`: `{ name: string, phone: string, licenseNo?: string }`
- `UpdateDriverDto`: `{ name?: string, phone?: string, licenseNo?: string }`

---

### Dispatch Manifests

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/dispatch-manifests?page=1&limit=10&status=&vehicleId=&driverId=&fromBranchId=&toBranchId=&dateFrom=&dateTo=` | Get all manifests (paginated) | Yes | All |
| GET | `/dispatch-manifests/:id` | Get manifest with items and totals | Yes | All |
| POST | `/dispatch-manifests` | Create manifest | Yes | ADMIN, MANAGER, SITE_OFFICER |
| POST | `/dispatch-manifests/:id/items` | Add consignments to manifest | Yes | ADMIN, MANAGER, SITE_OFFICER |
| DELETE | `/dispatch-manifests/:id/items/:itemId` | Remove item from manifest | Yes | ADMIN, MANAGER, SITE_OFFICER |
| PATCH | `/dispatch-manifests/:id/dispatch` | Dispatch manifest | Yes | ADMIN, MANAGER, SITE_OFFICER |
| PATCH | `/dispatch-manifests/:id/arrive` | Mark manifest as arrived | Yes | ADMIN, MANAGER, SITE_OFFICER |
| PATCH | `/dispatch-manifests/:id/close` | Close manifest | Yes | ADMIN, MANAGER |

**DTOs:**
- `CreateManifestDto`: `{ vehicleId: string, driverId: string, fromBranchId: string, toBranchId: string, departureTime?: string }`
- `AddItemsDto`: `{ consignmentIds: string[] }`

**Manifest Status Flow:**
```
CREATED → DISPATCHED → ARRIVED → CLOSED
```

**Manifest Totals Response (when getting by ID):**
```json
{
  "success": true,
  "message": "Manifest retrieved successfully",
  "data": {
    "manifest": { ... },
    "items": [ ... ],
    "totals": {
      "totalConsignments": 10,
      "totalQuantity": 100,
      "totalWeight": 5000,
      "totalPaidAmount": 50000,
      "totalRemainingAmount": 10000,
      "totalAmount": 60000
    }
  }
}
```

---

### Payments

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/payments?page=1&limit=10&consignmentId=&type=&method=&dateFrom=&dateTo=` | Get all payments (paginated) | Yes | All |
| GET | `/payments/:id` | Get payment by ID | Yes | All |
| GET | `/payments/consignment/:consignmentId` | Get payments by consignment | Yes | All |
| POST | `/payments/manual` | Create manual payment | Yes | ADMIN, MANAGER, SITE_OFFICER |
| POST | `/payments` | Create payment | Yes | ADMIN, MANAGER, SITE_OFFICER |
| PATCH | `/payments/:id` | Update payment | Yes | ADMIN, MANAGER |
| DELETE | `/payments/:id` | Delete payment | Yes | ADMIN |

**DTOs:**
- `CreateManualPaymentDto`: `{ consignmentId: string, amount: number, type: PaymentType, method: PaymentMethod }`
- `CreatePaymentDto`: `{ consignmentId: string, amount: number, type: PaymentType, method: PaymentMethod }`
- `UpdatePaymentDto`: `{ amount?: number, type?: PaymentType, method?: PaymentMethod }`

---

### Expenses

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/expenses?page=1&limit=10&branchId=&manifestId=&type=&dateFrom=&dateTo=` | Get all expenses (paginated) | Yes | All |
| GET | `/expenses/:id` | Get expense by ID | Yes | All |
| POST | `/expenses` | Create expense | Yes | ADMIN, MANAGER, SITE_OFFICER |
| PATCH | `/expenses/:id` | Update expense | Yes | ADMIN, MANAGER |
| DELETE | `/expenses/:id` | Delete expense | Yes | ADMIN, MANAGER |

**DTOs:**
- `CreateExpenseDto`: `{ branchId: string, manifestId?: string, type: ExpenseType, amount: number, note?: string }`
- `UpdateExpenseDto`: `{ branchId?: string, manifestId?: string, type?: ExpenseType, amount?: number, note?: string }`

---

### Dashboard

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/dashboard/stats?branchId=&dateFrom=&dateTo=` | Get dashboard statistics | Yes | All |
| GET | `/dashboard/recent-consignments?limit=10` | Get recent consignments | Yes | All |
| GET | `/dashboard/recent-manifests?limit=10` | Get recent manifests | Yes | All |

**Dashboard Stats Response:**
```json
{
  "success": true,
  "message": "Stats retrieved successfully",
  "data": {
    "todayBookings": 50,
    "todayRevenue": 500000,
    "todayPaidAmount": 450000,
    "todayRemainingAmount": 50000,
    "pendingDeliveries": 30,
    "inTransitConsignments": 25,
    "deliveredToday": 45,
    "totalToPayAmount": 150000,
    "totalExpenses": 50000,
    "estimatedProfit": 400000
  }
}
```

---

### Reports

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|----------------|-------|
| GET | `/reports/daily-bookings?date=&branchId=` | Daily booking report | Yes | ADMIN, MANAGER, SITE_OFFICER |
| GET | `/reports/manifest/:manifestId` | Manifest report | Yes | ADMIN, MANAGER, SITE_OFFICER |
| GET | `/reports/delivery-receipt/:consignmentId` | Delivery receipt | Yes | ADMIN, MANAGER, SITE_OFFICER |
| GET | `/reports/customer-ledger/:customerId` | Customer ledger | Yes | ADMIN, MANAGER, SITE_OFFICER |

**Daily Booking Report Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "consignments": [ ... ],
    "totals": {
      "totalConsignments": 50,
      "totalQuantity": 500,
      "totalWeight": 25000,
      "totalAmount": 500000,
      "totalPaid": 450000,
      "totalRemaining": 50000
    }
  }
}
```

---

## Frontend TypeScript Types

Create a file `types/api.types.ts` in your frontend project:

```typescript
// ==================== ENUMS ====================

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SITE_OFFICER = 'SITE_OFFICER',
}

export enum ConsignmentStatus {
  BOOKED = 'BOOKED',
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

export enum RateType {
  PER_ITEM = 'PER_ITEM',
  PER_KG = 'PER_KG',
}

export enum CustomerType {
  SENDER = 'SENDER',
  RECEIVER = 'RECEIVER',
  BOTH = 'BOTH',
}

// ==================== INTERFACES ====================

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// Paginated Response
export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ==================== AUTH ====================

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  branch?: Branch;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== CITY ====================

export interface City {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCityDto {
  name: string;
}

export interface UpdateCityDto {
  name?: string;
}

// ==================== BRANCH ====================

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  cityId?: string;
  city?: City;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchDto {
  name: string;
  address?: string;
  cityId?: string;
  contact?: string;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  cityId?: string;
  contact?: string;
}

// ==================== ITEM TYPE ====================

export interface ItemType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== CUSTOMER ====================

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  cityId?: string;
  city?: City;
  branchId?: string;
  branch?: Branch;
  type: CustomerType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  cityId?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  cityId?: string;
}

// ==================== RATE LIST ====================

export interface RateList {
  id: string;
  fromCityId: string;
  fromCity?: City;
  toCityId: string;
  toCity?: City;
  itemTypeId: string;
  itemType?: ItemType;
  rateType: RateType;
  rate: number;
  defaultLabor: number;
  defaultLoading: number;
  defaultUnloading: number;
  defaultWarehouse: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateListDto {
  fromCityId: string;
  toCityId: string;
  itemTypeId: string;
  rateType?: RateType;
  rate: number;
  defaultLabor?: number;
  defaultLoading?: number;
  defaultUnloading?: number;
  defaultWarehouse?: number;
  active?: boolean;
}

export interface FareCalculation {
  fare: number;
  labor: number;
  loading: number;
  unloading: number;
  warehouse: number;
  misc: number;
  stTax: number;
  ttTax: number;
  totalAmount: number;
}

// ==================== CONSIGNMENT ====================

export interface SenderReceiver {
  name: string;
  phone: string;
  cnic?: string;
  cityId?: string;
}

export interface Charges {
  fare: number;
  loading?: number;
  unloading?: number;
  labor?: number;
  warehouse?: number;
  misc?: number;
  stTax?: number;
  ttTax?: number;
}

export interface CreateConsignmentDto {
  sender: SenderReceiver;
  receiver: SenderReceiver;
  fromBranchId: string;
  toBranchId: string;
  fromCityId: string;
  toCityId: string;
  itemTypeId: string;
  quantity: number;
  weight?: number;
  goodsDescription: string;
  charges: Charges;
  payment?: {
    paymentStatus?: PaymentStatus;
    paidAmount?: number;
    method?: PaymentMethod;
  };
}

export interface UpdateConsignmentDto {
  goodsDescription?: string;
  quantity?: number;
  weight?: number;
  charges?: Partial<Charges>;
  payment?: {
    paidAmount?: number;
    method?: PaymentMethod;
  };
}

export interface DeliverConsignmentDto {
  warehouse?: number;
  labor?: number;
  misc?: number;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  receiverName?: string;
  remarks?: string;
}

export interface Consignment {
  id: string;
  biltyNumber: string;
  senderId: string;
  sender?: Customer;
  receiverId: string;
  receiver?: Customer;
  fromBranchId: string;
  fromBranch?: Branch;
  toBranchId: string;
  toBranch?: Branch;
  fromCityId: string;
  fromCity?: City;
  toCityId: string;
  toCity?: City;
  itemTypeId: string;
  itemType?: ItemType;
  status: ConsignmentStatus;
  paymentStatus: PaymentStatus;
  quantity: number;
  weight?: number;
  goodsDescription: string;
  fare: number;
  loading: number;
  unloading: number;
  labor: number;
  warehouse: number;
  misc: number;
  stTax: number;
  ttTax: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  createdById: string;
  createdBy?: User;
  deliveredAt?: string;
  payments?: Payment[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== VEHICLE ====================

export interface Vehicle {
  id: string;
  numberPlate: string;
  type?: string;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== DRIVER ====================

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== DISPATCH MANIFEST ====================

export interface ManifestItem {
  id: string;
  manifestId: string;
  consignmentId: string;
  consignment?: Consignment;
}

export interface ManifestTotals {
  totalConsignments: number;
  totalQuantity: number;
  totalWeight: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  totalAmount: number;
}

export interface DispatchManifest {
  id: string;
  manifestNumber: string;
  vehicleId: string;
  vehicle?: Vehicle;
  driverId: string;
  driver?: Driver;
  fromBranchId: string;
  fromBranch?: Branch;
  toBranchId: string;
  toBranch?: Branch;
  status: ManifestStatus;
  departureTime?: string;
  arrivalTime?: string;
  createdById: string;
  createdBy?: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManifestWithItems {
  manifest: DispatchManifest;
  items: ManifestItem[];
  totals: ManifestTotals;
}

export interface CreateManifestDto {
  vehicleId: string;
  driverId: string;
  fromBranchId: string;
  toBranchId: string;
  departureTime?: string;
}

export interface AddItemsDto {
  consignmentIds: string[];
}

// ==================== PAYMENT ====================

export interface Payment {
  id: string;
  consignmentId: string;
  consignment?: Consignment;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  isActive: boolean;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  consignmentId: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
}

// ==================== EXPENSE ====================

export interface Expense {
  id: string;
  branchId: string;
  branch?: Branch;
  manifestId?: string;
  manifest?: DispatchManifest;
  type: ExpenseType;
  amount: number;
  note?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  branchId: string;
  manifestId?: string;
  type: ExpenseType;
  amount: number;
  note?: string;
}

// ==================== DASHBOARD ====================

export interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  todayPaidAmount: number;
  todayRemainingAmount: number;
  pendingDeliveries: number;
  inTransitConsignments: number;
  deliveredToday: number;
  totalToPayAmount: number;
  totalExpenses: number;
  estimatedProfit: number;
}

// ==================== REPORTS ====================

export interface DailyBookingReport {
  consignments: Consignment[];
  totals: {
    totalConsignments: number;
    totalQuantity: number;
    totalWeight: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
  };
}

export interface DeliveryReceipt {
  consignment: Consignment;
  payments: Payment[];
}

export interface CustomerLedger {
  customer: Customer;
  consignments: Consignment[];
  totals: {
    totalConsignments: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
  };
}

// ==================== QUERY PARAMS ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ConsignmentFilters extends PaginationParams {
  biltyNumber?: string;
  status?: ConsignmentStatus;
  paymentStatus?: PaymentStatus;
  fromCityId?: string;
  toCityId?: string;
  fromBranchId?: string;
  toBranchId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ManifestFilters extends PaginationParams {
  status?: ManifestStatus;
  vehicleId?: string;
  driverId?: string;
  fromBranchId?: string;
  toBranchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentFilters extends PaginationParams {
  consignmentId?: string;
  type?: PaymentType;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpenseFilters extends PaginationParams {
  branchId?: string;
  manifestId?: string;
  type?: ExpenseType;
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardFilters {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface RateListFilters extends PaginationParams {
  fromCityId?: string;
  toCityId?: string;
  itemTypeId?: string;
  active?: boolean;
}

export interface CalculateFareParams {
  fromCityId: string;
  toCityId: string;
  itemTypeId: string;
  quantity: number;
  weight?: number;
}
```

---

## Notes

1. **Password Exclusion**: Password fields are automatically excluded from API responses using `@Exclude()` decorator and `ClassSerializerInterceptor`.

2. **Branch-Level Access**: 
   - MANAGER and SITE_OFFICER roles can only access data related to their assigned branch
   - ADMIN has full access to all branches

3. **Consignment Status Flow**:
   - `BOOKED` → `IN_TRANSIT` (when manifest is dispatched) → `ARRIVED` (when manifest arrives) → `DELIVERED`
   - `CANCELLED` can be set from `BOOKED` status

4. **Manifest Status Flow**:
   - `CREATED` → `DISPATCHED` → `ARRIVED` → `CLOSED`

5. **Pagination**: All list endpoints return paginated responses with `items` array and `meta` object containing pagination info.

---

## Swagger Documentation

Access the interactive API documentation at: `http://localhost:3000/api/docs`

The Swagger UI allows you to:
- View all endpoints with their parameters
- Test API calls directly from the browser
- See request/response schemas
- Authorize with JWT token for protected endpoints

---

## Error Codes

| HTTP Status | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |
