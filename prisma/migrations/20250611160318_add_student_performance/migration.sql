-- CreateTable
CREATE TABLE "StudentPerformance" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION NOT NULL,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPerformance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudentPerformance" ADD CONSTRAINT "StudentPerformance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPerformance" ADD CONSTRAINT "StudentPerformance_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
