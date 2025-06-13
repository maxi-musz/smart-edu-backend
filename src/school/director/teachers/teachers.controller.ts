import { Controller, Get, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';

@Controller('director/teachers')
@UseGuards(JwtGuard)
export class TeachersController {
    constructor(private readonly teachersService: TeachersService) {}

    @Get('dashboard')
    fetchTeachersDashboard(@GetUser() user: User) {
        return this.teachersService.fetchTeachersDashboard({
            school_id: user.school_id
        });
    }
}
