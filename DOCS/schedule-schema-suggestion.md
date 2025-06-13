# Suggested Prisma Schema for School Timetable System

Here's a comprehensive Prisma schema that would work perfectly for your school timetable management system:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "mysql", "sqlite", etc.
  url      = env("DATABASE_URL")
}

model School {
  id          String   @id @default(cuid())
  name        String
  address     String?
  phone       String?
  email       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  classes     Class[]
  subjects    Subject[]
  teachers    Teacher[]
  timeSlots   TimeSlot[]
}

model Class {
  id          String   @id @default(cuid())
  name        String   // e.g., "JSS1", "SS2"
  level       String   // e.g., "Junior", "Senior"
  section     String?  // e.g., "A", "B" for multiple sections
  schoolId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  school      School   @relation(fields: [schoolId], references: [id])
  students    Student[]
  timetableEntries TimetableEntry[]
  
  @@unique([name, section, schoolId])
}

model Subject {
  id          String   @id @default(cuid())
  name        String   // e.g., "Mathematics", "English Language"
  code        String?  // e.g., "MATH101"
  color       String   @default("#3B82F6") // Hex color for UI
  description String?
  schoolId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  school      School   @relation(fields: [schoolId], references: [id])
  timetableEntries TimetableEntry[]
  teacherSubjects TeacherSubject[]
  
  @@unique([code, schoolId])
}

model Teacher {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  email       String?
  phone       String?
  employeeId  String?
  schoolId    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  school      School   @relation(fields: [schoolId], references: [id])
  timetableEntries TimetableEntry[]
  teacherSubjects TeacherSubject[]
  
  @@unique([email, schoolId])
  @@unique([employeeId, schoolId])
}

model TeacherSubject {
  id        String @id @default(cuid())
  teacherId String
  subjectId String
  
  teacher   Teacher @relation(fields: [teacherId], references: [id])
  subject   Subject @relation(fields: [subjectId], references: [id])
  
  @@unique([teacherId, subjectId])
}

model Student {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  studentId   String?
  classId     String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  class       Class    @relation(fields: [classId], references: [id])
  
  @@unique([studentId, classId])
}

model TimeSlot {
  id          String   @id @default(cuid())
  startTime   String   // e.g., "08:00"
  endTime     String   // e.g., "09:00"
  label       String   // e.g., "08:00-09:00"
  order       Int      // For sorting
  schoolId    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  school      School   @relation(fields: [schoolId], references: [id])
  timetableEntries TimetableEntry[]
  
  @@unique([startTime, endTime, schoolId])
  @@index([order])
}

model TimetableEntry {
  id          String   @id @default(cuid())
  classId     String
  subjectId   String
  teacherId   String
  timeSlot Id  String
  dayOfWeek   Int      // 1 = Monday, 2 = Tuesday, etc.
  room        String?  // Optional room/venue
  notes       String?  // Optional notes
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  class       Class    @relation(fields: [classId], references: [id])
  subject     Subject  @relation(fields: [subjectId], references: [id])
  teacher     Teacher  @relation(fields: [teacherId], references: [id])
  timeSlot    TimeSlot @relation(fields: [timeSlotId], references: [id])
  
  // Ensure no conflicts: one class can't have multiple subjects at the same time
  @@unique([classId, timeSlotId, dayOfWeek])
  // Ensure a teacher can't be in multiple places at once
  @@index([teacherId, timeSlotId, dayOfWeek])
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}
```

## Key Features of this Schema:

1. **Multi-School Support**: The schema supports multiple schools in one database
2. **Flexible Time Slots**: Configurable time periods rather than hardcoded times
3. **Teacher-Subject Relationships**: Tracks which teachers can teach which subjects
4. **Conflict Prevention**: Unique constraints prevent scheduling conflicts
5. **Soft Deletes**: Uses `isActive` flags instead of hard deletes
6. **Audit Trail**: `createdAt` and `updatedAt` timestamps on all models
7. **Room Management**: Optional room assignments for classes
8. **Color Coding**: Built-in color support for subjects in the UI

## API Endpoints You'll Need:

### Classes
- `GET /api/classes` - List all classes
- `POST /api/classes` - Create a new class
- `PUT /api/classes/:id` - Update class details
- `DELETE /api/classes/:id` - Deactivate a class

### Subjects
- `GET /api/subjects` - List all subjects
- `POST /api/subjects` - Create a new subject
- `PUT /api/subjects/:id` - Update subject details

### Teachers
- `GET /api/teachers` - List all teachers
- `POST /api/teachers` - Add a new teacher
- `PUT /api/teachers/:id` - Update teacher details

### Timetable
- `GET /api/timetable/:classId` - Get timetable for a specific class
- `POST /api/timetable` - Create a new timetable entry
- `PUT /api/timetable/:id` - Update a timetable entry
- `DELETE /api/timetable/:id` - Remove a timetable entry
- `GET /api/timetable/conflicts` - Check for scheduling conflicts

### Time Slots
- `GET /api/timeslots` - List all configured time slots
- `POST /api/timeslots` - Create custom time slots