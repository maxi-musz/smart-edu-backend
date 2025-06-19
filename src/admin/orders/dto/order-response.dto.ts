export class OrderItemResponseDto {
    id: string;
    name: string;
    quantity: number;
    price: number;
    isbn?: string;
    publisher?: string;
    format?: string;
}

export class CustomerResponseDto {
    name: string;
    email: string;
    phone: string;
}

export class OrderResponseDto {
    id: string;
    customer: CustomerResponseDto;
    date: string;
    items: OrderItemResponseDto[];
    total: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    shippingAddress: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    orderNumber: string;
    createdAt: string;
    updatedAt: string;
}

export class OrderStatsResponseDto {
    totalOrders: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
}

export class OrderPaginationResponseDto {
    currentPage: number;
    totalPages: number;
    perPage: number;
    totalItems: number;
}

export class OrderFiltersResponseDto {
    statuses: string[];
    paymentStatuses: string[];
    paymentMethods: string[];
}

export class OrdersDashboardResponseDto {
    orders: OrderResponseDto[];
    stats: OrderStatsResponseDto;
    pagination: OrderPaginationResponseDto;
    filters: OrderFiltersResponseDto;
} 