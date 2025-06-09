import { Module } from '@nestjs/common';
import { DirectorModule } from './director/director.module';
import { TeachersModule } from './teachers/teachers.module';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DirectorModule, TeachersModule, StudentsModule, AuthModule]
})
export class SchoolModule {}
