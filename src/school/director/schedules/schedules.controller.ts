import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger, ValidationPipe } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateTimetableDTO, getTimeTableDTO, TimeSlotDTO, UpdateTimeSlotDTO } from 'src/shared/dto/schedules.dto';

import { User } from '@prisma/client';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';

@Controller('director/schedules')
@UseGuards(JwtGuard)
export class SchedulesController {
  private readonly logger = new Logger(SchedulesController.name);

  constructor(private readonly schedulesService: SchedulesService) {}

  // Time Slot Management Endpoints
  @Post('create-time-slot')
  async createTimeSlot(
    @GetUser() user: User,
    @Body(ValidationPipe) dto: TimeSlotDTO
  ) {
    return this.schedulesService.createTimeSlot(user, dto);
  }

  @Get('time-slots')
  async getTimeSlots(@GetUser() user: User) {
    return this.schedulesService.getTimeSlots(user);
  }

  @Put('time-slots/:id')
  async updateTimeSlot(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateTimeSlotDTO
  ) {
    return this.schedulesService.updateTimeSlot(user, id, dto);
  }

  @Delete('time-slots/:id')
  async deleteTimeSlot(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    return this.schedulesService.deleteTimeSlot(user, id);
  }

  // Existing endpoints
  @Get('timetable')
  async getTimetableSchedules(@Body(ValidationPipe) dto: getTimeTableDTO) {
    return this.schedulesService.getTimetable(dto);
  }

  @Post("create-timetable")
  async addScheduleToTimetable(
    @GetUser() user: User, 
    @Body(ValidationPipe) dto: CreateTimetableDTO
  ) {
    return this.schedulesService.addScheduleToTimetable(dto, user);
  }
}