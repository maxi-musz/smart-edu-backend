import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(private prisma: PrismaService) {}

  async getAllClasses(user: any) {
    this.logger.log(colors.cyan(`Fetching all classes for school: ${user.school_id}`));

    const classes = await this.prisma.class.findMany({
      where: {
        schoolId: user.school_id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    this.logger.log(`Found ${classes.length} classes`);

    return new ApiResponse(
        true,
        `Total of ${classes.length} classes retrieved`,
        classes
    );
  }
}
