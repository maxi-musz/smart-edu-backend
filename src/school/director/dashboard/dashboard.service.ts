import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) {}

    // get director dashboard
    async getDirectorDashboard(payload: any) {
        console.log(colors.blue("Fetching director dashboard data..."));

        try {
            // First get the director's school_id
            const director = await this.prisma.user.findUnique({
                where: {
                    id: payload.sub
                },
                select: {
                    school_id: true,
                    email: true
                }
            });

            if (!director) {
                console.log(colors.red("User not found..."))
                throw new Error("Director not found");
            }

            // Get all teachers from the same school
            const teachers = await this.prisma.user.findMany({
                where: {
                    school_id: director.school_id,
                    role: "teacher"
                },
                select: {
                    id: true,
                    email: true,
                    createdAt: true
                }
            });

            const formattedResponse = {
                basic_details: {
                    email: director.email,
                    school_id: director.school_id
                },
                teachers: teachers
            }

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
