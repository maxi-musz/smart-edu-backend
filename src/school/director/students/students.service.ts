import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import { AcademicTerm, UserStatus, User, DayOfWeek } from '@prisma/client';

export interface FetchStudentsDashboardDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    class_id?: string;
    sort_by?: 'cgpa' | 'position' | 'name' | 'createdAt';
    sort_order?: 'asc' | 'desc';
}

interface StudentPerformance {
    cgpa: number;
    term_average: number;
    improvement_rate: number;
    attendance_rate: number;
    position: number;
}

interface StudentWithDetails extends User {
    student_id: string;
    current_class: string;
    next_class: string;
    next_class_time: string | null;
    next_class_teacher: string | null;
    performance: StudentPerformance;
}

@Injectable()
export class StudentsService {
    constructor(private prisma: PrismaService) {}

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

    private async calculatePerformanceMetrics(studentId: string, classId: string): Promise<Omit<StudentPerformance, 'position'>> {
        const performances = await this.prisma.studentPerformance.findMany({
            where: { 
                student_id: studentId,
                class_id: classId
            },
            orderBy: [
                { year: 'desc' },
                { term: 'desc' }
            ],
            take: 3 // Last 3 terms
        });

        if (performances.length === 0) {
            return {
                cgpa: 0,
                term_average: 0,
                improvement_rate: 0,
                attendance_rate: 0
            };
        }

        const cgpa = Number((performances.reduce((sum, perf) => 
            sum + (perf.total_score / perf.max_score), 0) / performances.length * 4).toFixed(2));

        const termAverage = Number((performances[0].total_score / performances[0].max_score * 100).toFixed(2));
        
        // Calculate improvement rate (comparing current term with previous term)
        const improvementRate = performances.length > 1 ? 
            Number((((performances[0].total_score / performances[0].max_score) - 
                    (performances[1].total_score / performances[1].max_score)) * 100).toFixed(2)) : 0;

        return {
            cgpa,
            term_average: termAverage,
            improvement_rate: improvementRate,
            attendance_rate: 0 // TODO: Implement attendance tracking
        };
    }

    private async calculateClassPosition(classId: string, studentId: string): Promise<number> {
        const school = await this.prisma.school.findFirst({
            where: {
                classes: {
                    some: { id: classId }
                }
            },
            select: {
                current_term: true,
                current_year: true
            }
        });

        if (!school) return 0;

        const termNumber = school.current_term === AcademicTerm.first ? 1 :
                          school.current_term === AcademicTerm.second ? 2 : 3;

        const performances = await this.prisma.studentPerformance.findMany({
            where: {
                class_id: classId,
                year: school.current_year,
                term: termNumber
            },
            orderBy: {
                total_score: 'desc'
            }
        });

        const position = performances.findIndex(p => p.student_id === studentId) + 1;
        return position || 0;
    }

    async fetchStudentsDashboard(schoolId: string, dto: FetchStudentsDashboardDto = {}) {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            class_id,
            sort_by = 'createdAt',
            sort_order = 'desc'
        } = dto;

        const skip = (page - 1) * limit;

        // Basic details
        const totalStudents = await this.prisma.user.count({
            where: {
                school_id: schoolId,
                role: "student"
            }
        });

        const activeStudents = await this.prisma.user.count({
            where: {
                school_id: schoolId,
                role: "student",
                status: UserStatus.active
            }
        });

        // Students list with pagination, filtering, and sorting
        const students = await this.prisma.user.findMany({
            where: {
                school_id: schoolId,
                role: "student",
                ...(status && { status }),
                ...(class_id && {
                    classesEnrolled: {
                        some: { id: class_id }
                    }
                }),
                ...(search && {
                    OR: [
                        { first_name: { contains: search, mode: 'insensitive' } },
                        { last_name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                })
            },
            include: {
                classesEnrolled: true
            },
            orderBy: {
                [sort_by === 'name' ? 'first_name' : sort_by]: sort_order
            },
            skip,
            take: limit
        });

        // Get next class and performance metrics for each student
        const studentsWithDetails: StudentWithDetails[] = await Promise.all(students.map(async (student) => {
            const currentClass = student.classesEnrolled[0];
            if (!currentClass) {
                return {
                    ...student,
                    student_id: `smh/${new Date().getFullYear()}/${String(student.id).padStart(3, '0')}`,
                    current_class: 'Not Enrolled',
                    next_class: 'No classes',
                    next_class_time: null,
                    next_class_teacher: null,
                    performance: {
                        cgpa: 0,
                        term_average: 0,
                        improvement_rate: 0,
                        attendance_rate: 0,
                        position: 0
                    }
                } as StudentWithDetails;
            }

            const nextClass = await this.prisma.timetableEntry.findFirst({
                where: {
                    class_id: currentClass.id,
                    day_of_week: this.getCurrentDayOfWeek(),
                    timeSlot: {
                        startTime: {
                            gt: this.getCurrentTimeHHMM()
                        }
                    },
                    isActive: true,
                },
                orderBy: {
                    timeSlot: { order: 'asc' }
                },
                include: {
                    subject: true,
                    teacher: {
                      select: {
                        first_name: true,
                        last_name: true
                      }
                    },
                    timeSlot: true
                },
            });

            return {
                ...student,
                student_id: `smh/${new Date().getFullYear()}/${String(student.id).padStart(3, '0')}`,
                current_class: currentClass.name,
                next_class: nextClass?.subject.name || 'No classes',
                next_class_time: nextClass?.timeSlot.startTime || null,
                next_class_teacher: nextClass ? `${nextClass.teacher.first_name} ${nextClass.teacher.last_name}` : null,
                performance: {
                    ...(await this.calculatePerformanceMetrics(student.id, currentClass.id)),
                    position: await this.calculateClassPosition(currentClass.id, student.id)
                }
            };
        }));

        return ResponseHelper.success(
            "Students dashboard data fetched successfully",
            {
                basic_details: {
                    totalStudents,
                    activeStudents,
                    totalClasses: await this.prisma.class.count({ where: { schoolId } })
                },
                students: studentsWithDetails,
                pagination: {
                    total_pages: Math.ceil(totalStudents / limit),
                    current_page: page,
                    total_results: totalStudents,
                    results_per_page: limit
                }
            }
        );
    }

    // Other methods for student management
} 