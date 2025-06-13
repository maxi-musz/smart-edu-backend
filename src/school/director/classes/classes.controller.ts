import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';

@Controller('director/classes')
@UseGuards(JwtGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get("fetch-all-classes")
  async getAllClasses(@GetUser() user: User) {
    return this.classesService.getAllClasses(user);
  }
}
