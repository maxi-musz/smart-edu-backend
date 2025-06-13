import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min, Matches, IsBoolean } from "class-validator";

export class getTimeTableDTO {
    @IsString()
    @IsNotEmpty()
    class: ClassLevel
}

enum ClassLevel {
    "jss1",
    "jss2",
    "jss3",
    "ss1",
    "ss2",
    "ss3"
}

export enum DayOfWeek {
    MONDAY = 'MONDAY',
    TUESDAY = 'TUESDAY',
    WEDNESDAY = 'WEDNESDAY',
    THURSDAY = 'THURSDAY',
    FRIDAY = 'FRIDAY',
    SATURDAY = 'SATURDAY',
    SUNDAY = 'SUNDAY'
}

export class CreateTimetableDTO {
    @IsString()
    @IsNotEmpty()
    class_id: string;

    @IsString()
    @IsNotEmpty()
    subject_id: string;

    @IsString()
    @IsNotEmpty()
    teacher_id: string;

    @IsString()
    @IsNotEmpty()
    timeSlotId: string;

    @IsEnum(DayOfWeek)
    @IsNotEmpty()
    day_of_week: DayOfWeek;

    @IsString()
    @IsOptional()
    room?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class TimeSlotDTO {
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (e.g., 08:30)'
  })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format (e.g., 10:30)'
  })
  endTime: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  order: number;
}

export class UpdateTimeSlotDTO {
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (e.g., 08:30)'
  })
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format (e.g., 10:30)'
  })
  endTime?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}