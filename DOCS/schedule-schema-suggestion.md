# Prisma Schema for Multi-Store E-commerce Platform

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Store {
  id          String   @id @default(cuid())
  name        String
  description String?
  address     String?
  phone       String?
  email       String?
  logo        String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  products    Product[]
  users       User[]
  orders      Order[]
  categories  Category[]
}

model User {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  email       String   @unique
  password    String
  phone       String?
  role        UserRole @default(BUYER)
  storeId     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  store       Store?   @relation(fields: [storeId], references: [id])
  orders      Order[]
  cart        Cart?
  referrals   Referral[] @relation("Referrer")
  referredBy  Referral[] @relation("Referred")
  commissions Commission[]
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  stock       Int
  images      String[]
  categoryId  String
  storeId     String
  commission  Float    @default(0) // Commission percentage for marketers
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  category    Category @relation(fields: [categoryId], references: [id])
  store       Store    @relation(fields: [storeId], references: [id])
  cartItems   CartItem[]
  orderItems  OrderItem[]
  referrals   Referral[]
}

model Category {
  id          String   @id @default(cuid())
  name        String
  description String?
  storeId     String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  store       Store    @relation(fields: [storeId], references: [id])
  products    Product[]
  
  @@unique([name, storeId])
}

model Cart {
  id          String   @id @default(cuid())
  userId      String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  items       CartItem[]
}

model CartItem {
  id          String   @id @default(cuid())
  cartId      String
  productId   String
  quantity    Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  cart        Cart     @relation(fields: [cartId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])
  
  @@unique([cartId, productId])
}

model Order {
  id          String   @id @default(cuid())
  userId      String
  storeId     String
  status      OrderStatus @default(PENDING)
  total       Float
  shippingAddress String
  trackingNumber String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  store       Store    @relation(fields: [storeId], references: [id])
  items       OrderItem[]
  commissions Commission[]
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  quantity    Int
  price       Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  order       Order    @relation(fields: [orderId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])
}

model Referral {
  id          String   @id @default(cuid())
  referrerId  String
  referredId  String
  productId   String
  code        String   @unique
  isUsed      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  referrer    User     @relation("Referrer", fields: [referrerId], references: [id])
  referred    User     @relation("Referred", fields: [referredId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])
}

model Commission {
  id          String   @id @default(cuid())
  userId      String
  orderId     String
  amount      Float
  status      CommissionStatus @default(PENDING)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  order       Order    @relation(fields: [orderId], references: [id])
}

enum UserRole {
  ADMIN
  MARKETER
  BUYER
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

enum CommissionStatus {
  PENDING
  PAID
  CANCELLED
}
```

## Key Features of this Schema:

1. **Multi-Store Support**: Each store can have its own products, categories, and users
2. **User Roles**: Supports admin, marketer, and buyer roles
3. **Product Management**: Products with categories, stock, and commission settings
4. **Cart System**: Persistent cart with items
5. **Order Management**: Complete order tracking with status updates
6. **Referral System**: Track referrals and generate unique codes
7. **Commission Tracking**: Monitor marketer commissions per order
8. **Soft Deletes**: Uses `isActive` flags for soft deletion
9. **Audit Trail**: `createdAt` and `updatedAt` timestamps on all models

## API Endpoints You'll Need:

### Stores
- `GET /api/stores` - List all stores
- `POST /api/stores` - Create a new store
- `PUT /api/stores/:id` - Update store details
- `DELETE /api/stores/:id` - Deactivate a store

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update product details
- `DELETE /api/products/:id` - Deactivate a product

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Add a new user
- `PUT /api/users/:id` - Update user details

### Cart
- `GET /api/cart` - Get current user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update order status
- `GET /api/orders/:id` - Get order details

### Referrals
- `GET /api/referrals` - List all referrals
- `POST /api/referrals` - Create a new referral
- `GET /api/referrals/:code` - Validate referral code

### Commissions
- `GET /api/commissions` - List all commissions
- `PUT /api/commissions/:id` - Update commission status