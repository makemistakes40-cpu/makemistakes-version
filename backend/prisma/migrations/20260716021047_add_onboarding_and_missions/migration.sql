-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasCompletedProOnboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "xpPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_missions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "estimatedTime" TEXT NOT NULL,
    "skills" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "currentStep" TEXT NOT NULL DEFAULT 'BRIEF',
    "codeContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_missions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
