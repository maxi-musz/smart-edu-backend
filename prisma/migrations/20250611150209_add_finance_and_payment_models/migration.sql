-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('full', 'partial');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('credit', 'debit');

-- CreateTable
CREATE TABLE "Finance" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstanding_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount_withdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "finance_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "payment_for" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Finance_school_id_key" ON "Finance"("school_id");

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_finance_id_fkey" FOREIGN KEY ("finance_id") REFERENCES "Finance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
