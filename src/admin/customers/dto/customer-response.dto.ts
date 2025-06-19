export class CustomerResponseDto {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    joinDate: string;
    totalOrders: number;
    totalValue: number;
    totalOwed: number;
    level: string;
    paymentPercentage: number;
    lastOrderDate?: string;
    status: string;
}

export class CustomerStatsResponseDto {
    totalCustomers: number;
    activeCustomers: number;
    totalOrders: number;
    totalValue: number;
    totalOwed: number;
}

export class CustomersDashboardResponseDto {
    customers: CustomerResponseDto[];
    stats: CustomerStatsResponseDto;
} 