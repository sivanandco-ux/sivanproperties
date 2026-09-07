-- CreateTable
CREATE TABLE "allowed_testers" (
    "email" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allowed_testers_pkey" PRIMARY KEY ("email")
);
