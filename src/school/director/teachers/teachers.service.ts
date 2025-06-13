import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class TeachersService {
    constructor(private readonly prisma: PrismaService) {}

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

    ////////////////////////////////////////////////////// Teachers dashboard
    async fetchTeachersDashboard(dto: { school_id: string }) {
        console.log(colors.cyan("Fetching teacher tab..."));

        try {
            const { school_id } = dto;

            // Get basic stats
            const [totalTeachers, activeTeachers, maleTeachers, femaleTeachers, teachers] = await Promise.all([
                this.prisma.user.count({
                    where: { 
                        school_id,
                        role: "teacher"
                    }
                }),
                this.prisma.user.count({
                    where: { 
                        school_id,
                        role: "teacher",
                        status: "active"
                    }
                }),
                this.prisma.user.count({
                    where: { 
                        school_id,
                        role: "teacher",
                        gender: "male"
                    }
                }),
                this.prisma.user.count({
                    where: { 
                        school_id,
                        role: "teacher",
                        gender: "female"
                    }
                }),
                this.prisma.user.findMany({
                    where: {
                        school_id,
                        role: "teacher"
                    },
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                        display_picture: true,
                        status: true,
                        subjectsTeaching: {
                            include: {
                                subject: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        },
                        classesManaging: {
                            select: {
                                name: true
                            }
                        }
                    }
                })
            ]);

            // Get next classes for each teacher
            const teachersWithNextClass = await Promise.all(
                teachers.map(async (teacher) => {
                    const nextClass = await this.prisma.timetableEntry.findFirst({
                        where: {
                            teacher_id: teacher.id,
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
                            timeSlot: true,
                        }
                    });

                    return {
                        ...teacher,
                        subjectsTeaching: teacher.subjectsTeaching.map(ts => ts.subject.name),
                        nextClass: nextClass ? {
                            className: nextClass.class.name,
                            subject: nextClass.subject.name,
                            startTime: nextClass.timeSlot.startTime,
                            endTime: nextClass.timeSlot.endTime
                        } : null
                    };
                })
            );

            const formattedResponse = {
                basic_details: {
                    totalTeachers,
                    activeTeachers,
                    maleTeachers,
                    femaleTeachers
                },
                teachers: teachersWithNextClass.map(teacher => ({
                    id: teacher.id,
                    name: `${teacher.first_name} ${teacher.last_name}`,
                    display_picture: teacher.display_picture,
                    contact: {
                        phone: teacher.phone_number,
                        email: teacher.email
                    },
                    totalSubjects: teacher.subjectsTeaching.length,
                    classTeacher: teacher.classesManaging[0]?.name || 'None',
                    nextClass: teacher.nextClass,
                    status: teacher.status
                }))
            };

            return ResponseHelper.success(
                "Teachers dashboard data fetched successfully",
                formattedResponse
            );

        } catch (error) {
            console.log(colors.red("Error fetching teachers dashboard data: "), error);
            throw error;
        }
    }
}
