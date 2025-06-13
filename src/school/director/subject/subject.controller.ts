import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { CreateSubjectDto, EditSubjectDto } from 'src/shared/dto/subject.dto';

@Controller('director/subjects')
@UseGuards(JwtGuard)
export class SubjectController {
    constructor(private readonly subjectService: SubjectService) {}

    @Get('fetch-all-subjects')
    fetchAllSubjects(@GetUser() user: User) {
        return this.subjectService.fetchAllSubjects(user);
    }

    @Post('create-subject')
    createSubject(
        @GetUser() user: User,
        @Body() dto: CreateSubjectDto
    ) {
        return this.subjectService.createSubject(user, dto);
    }

    @Put('edit-subject/:id')
    editSubject(
        @GetUser() user: User,
        @Param('id') subjectId: string,
        @Body() data: EditSubjectDto
    ) {
        return this.subjectService.editSubject(user, subjectId, data);
    }
}
