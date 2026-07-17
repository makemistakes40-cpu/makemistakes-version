-- CreateTable
CREATE TABLE "PersonalRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "languages" TEXT NOT NULL,
    "dreamCompany" TEXT NOT NULL,
    "timeAvailable" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalRoadmap_userId_key" ON "PersonalRoadmap"("userId");

-- AddForeignKey
ALTER TABLE "PersonalRoadmap" ADD CONSTRAINT "PersonalRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
