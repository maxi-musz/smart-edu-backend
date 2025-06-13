import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { DayOfWeek, User } from '@prisma/client';
import { TeachersService } from '../teachers/teachers.service';

@Injectable()
export class DashboardService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly teachersService: TeachersService
    ) {}

    // Helper to get current DayOfWeek enum string
    private getCurrentDayOfWeek(): DayOfWeek {
      const dayIndex = new Date().getDay();
      const days: DayOfWeek[] = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];
      return days[dayIndex];
    }

    // Helper to get current time in HH:MM format
    private getCurrentTimeHHMM(): string {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // get director dashboard
    async getDirectorDashboard(user: User) {
        console.log(colors.blue("Fetching director dashboard data..."));
      
        try {
          const director = await this.prisma.user.findUnique({
            where: {
              email: user.email
            },
            select: { school_id: true, email: true },
          });
      
          if (!director) {
            console.log(colors.red("User not found..."));
            throw new NotFoundException("Director not found");
          }
      
          const [teachers, classes, subjects, totalStudents, activeStudents, suspendedStudents, finance, ongoingClasses, notifications] = await Promise.all([
            this.prisma.user.count({
              where: { school_id: director.school_id, role: "teacher" },
            }),
            this.prisma.class.count({
              where: { schoolId: director.school_id },
            }),
            this.prisma.subject.count({
              where: { schoolId: director.school_id },
            }),
            this.prisma.user.count({
              where: { school_id: director.school_id, role: "student" },
            }),
            this.prisma.user.count({
              where: {
                school_id: director.school_id,
                role: "student",
                status: "active",
              },
            }),
            this.prisma.user.count({
              where: {
                school_id: director.school_id,
                role: "student",
                status: "suspended",
              },
            }),
            this.prisma.finance.findUnique({
              where: { school_id: director.school_id },
              select: {
                total_revenue: true,
                outstanding_fee: true,
                amount_withdrawn: true
              }
            }),
            this.prisma.timetableEntry.findMany({
              where: {
                school_id: director.school_id,
                day_of_week: this.getCurrentDayOfWeek(),
                timeSlot: {
                  startTime: {
                    lte: this.getCurrentTimeHHMM()
                  },
                  endTime: {
                    gte: this.getCurrentTimeHHMM()
                  }
                },
                isActive: true,
              },
              include: {
                class: {
                  select: {
                    name: true
                  }
                },
                subject: {
                  select: {
                    name: true
                  }
                },
                teacher: {
                  select: {
                    first_name: true,
                    last_name: true
                  }
                },
                timeSlot: true,
              }
            }),
            this.prisma.notification.findMany({
              where: {
                school_id: director.school_id,
                OR: [
                  { type: 'all' },
                  { type: 'school_director' }
                ]
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 5
            })
          ]);
      
          const formattedResponse = {
            basic_details: {
              email: director.email,
              school_id: director.school_id,
            },
            teachers: {
              totalTeachers: teachers,
              activeClasses: classes,
              totalSubjects: subjects,
            },
            students: {
              totalStudents,
              activeStudents,
              suspendedStudents,
            },
            finance: {
              totalRevenue: finance?.total_revenue || 0,
              outstandingFees: finance?.outstanding_fee || 0,
              totalExpenses: finance?.amount_withdrawn || 0,
              netBalance: (finance?.total_revenue || 0) - (finance?.amount_withdrawn || 0)
            },
            ongoingClasses: ongoingClasses.map(entry => ({
              className: entry.class.name,
              subject: entry.subject.name,
              teacher: `${entry.teacher.first_name} ${entry.teacher.last_name}`,
              startTime: entry.timeSlot.startTime,
              endTime: entry.timeSlot.endTime
            })),
            notifications: notifications.map(notification => ({
              id: notification.id,
              title: notification.title,
              description: notification.description,
              type: notification.type,
              createdAt: notification.createdAt
            }))
          };
      
          console.log(colors.magenta("Director dashboard data fetched successfully"));
          return ResponseHelper.success(
            "Director dashboard data fetched successfully", 
            formattedResponse
        );
      
        } catch (error) {
          console.log(colors.red("Error fetching director dashboard data: "), error);
          throw error;
        }
    }
    
}
