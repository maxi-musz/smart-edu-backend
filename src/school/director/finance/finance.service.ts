import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import { PaymentType, TransactionType } from '@prisma/client';

export interface FetchFinanceDashboardDto {
    page?: number;
    limit?: number;
    search?: string;
    start_date?: Date;
    end_date?: Date;
    payment_type?: PaymentType;
    transaction_type?: TransactionType;
}

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) {}

    async fetchFinanceDashboard(schoolId: string, dto: FetchFinanceDashboardDto = {}) {
        const {
            page = 1,
            limit = 10,
            search = '',
            start_date,
            end_date,
            payment_type,
            transaction_type
        } = dto;

        const skip = (page - 1) * limit;

        // Get basic financial details
        const finance = await this.prisma.finance.findFirst({
            where: { 
                school_id: schoolId 
            },
            select: {
                total_revenue: true,
                outstanding_fee: true,
                amount_withdrawn: true
            }
        });

        // Get school fees transactions
        const schoolFees = await this.prisma.payment.findMany({
            where: {
                finance: { school_id: schoolId },
                payment_for: 'School Fee',
                ...(payment_type && { payment_type }),
                ...(transaction_type && { transaction_type }),
                ...(start_date && { payment_date: { gte: start_date } }),
                ...(end_date && { payment_date: { lte: end_date } }),
                ...(search && {
                    OR: [
                        { student: { first_name: { contains: search, mode: 'insensitive' } } },
                        { student: { last_name: { contains: search, mode: 'insensitive' } } },
                        { class: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                })
            },
            include: {
                student: {
                    select: {
                        first_name: true,
                        last_name: true
                    }
                },
                class: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                payment_date: 'desc'
            },
            skip,
            take: limit
        });

        // Get other fees transactions
        const otherFees = await this.prisma.payment.findMany({
            where: {
                finance: { school_id: schoolId },
                payment_for: { not: 'School Fee' },
                ...(payment_type && { payment_type }),
                ...(transaction_type && { transaction_type }),
                ...(start_date && { payment_date: { gte: start_date } }),
                ...(end_date && { payment_date: { lte: end_date } }),
                ...(search && {
                    OR: [
                        { student: { first_name: { contains: search, mode: 'insensitive' } } },
                        { student: { last_name: { contains: search, mode: 'insensitive' } } },
                        { payment_for: { contains: search, mode: 'insensitive' } }
                    ]
                })
            },
            include: {
                student: {
                    select: {
                        first_name: true,
                        last_name: true,
                        role: true
                    }
                }
            },
            orderBy: {
                payment_date: 'desc'
            },
            skip,
            take: limit
        });

        // Get expenses
        const expenses = await this.prisma.payment.findMany({
            where: {
                finance: { school_id: schoolId },
                transaction_type: TransactionType.debit,
                ...(start_date && { payment_date: { gte: start_date } }),
                ...(end_date && { payment_date: { lte: end_date } }),
                ...(search && {
                    OR: [
                        { payment_for: { contains: search, mode: 'insensitive' } },
                        { student: { first_name: { contains: search, mode: 'insensitive' } } },
                        { student: { last_name: { contains: search, mode: 'insensitive' } } }
                    ]
                })
            },
            include: {
                student: {
                    select: {
                        first_name: true,
                        last_name: true
                    }
                }
            },
            orderBy: {
                payment_date: 'desc'
            },
            skip,
            take: limit
        });

        // Format the response
        const formattedSchoolFees = schoolFees.map(fee => ({
            student_name: `${fee.student.first_name} ${fee.student.last_name}`,
            class: fee.class.name,
            amount: fee.amount,
            date: fee.payment_date,
            type: fee.payment_type,
            status: fee.transaction_type === TransactionType.credit ? 'paid' : 'refunded'
        }));

        const formattedOtherFees = otherFees.map(fee => ({
            payer_name: `${fee.student.first_name} ${fee.student.last_name}`,
            role: fee.student.role,
            purpose: fee.payment_for,
            amount: fee.amount,
            date: fee.payment_date,
            status: fee.transaction_type === TransactionType.credit ? 'paid' : 'refunded'
        }));

        const formattedExpenses = expenses.map(expense => ({
            expense_name: expense.payment_for,
            spent_by: `${expense.student.first_name} ${expense.student.last_name}`,
            amount: expense.amount,
            date: expense.payment_date,
            status: 'completed' // TODO: Add status field to Payment model
        }));

        return ResponseHelper.success("Finance dashboard data fetched successfully", {
            pagination: {
                total: schoolFees.length + otherFees.length + expenses.length,
                page,
                limit,
                total_pages: Math.ceil((schoolFees.length + otherFees.length + expenses.length) / limit)
            },
            basic_details: {
                total_revenue: finance?.total_revenue || 0,
                outstanding_fees: finance?.outstanding_fee || 0,
                total_expenses: finance?.amount_withdrawn || 0,
                net_balance: (finance?.total_revenue || 0) - (finance?.amount_withdrawn || 0)
            },
            transactions: {
                school_fees: formattedSchoolFees,
                other_fees: formattedOtherFees,
                expenses: formattedExpenses
            },
            
        });
    }
} 