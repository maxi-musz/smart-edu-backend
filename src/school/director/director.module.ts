import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { TeachersModule } from './teachers/teachers.module';
import { StudentsModule } from './students/students.module';
import { FinanceModule } from './finance/finance.module';
import { CoursesModule } from './courses/courses.module';
import { SchedulesModule } from './schedules/schedules.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectModule } from './subject/subject.module';

@Module({
  imports: [DashboardModule, TeachersModule, StudentsModule, FinanceModule, CoursesModule, SchedulesModule, NotificationsModule, SettingsModule, ProfilesModule, ClassesModule, SubjectModule]
})
export class DirectorModule {}
