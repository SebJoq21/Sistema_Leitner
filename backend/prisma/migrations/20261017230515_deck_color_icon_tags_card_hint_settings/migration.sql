-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "hint" TEXT,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "decks" ADD COLUMN     "color" TEXT DEFAULT '#1D4ED8',
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "metaDiaria" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "user_settings" (
    "userId" UUID NOT NULL,
    "intervalos" INTEGER[] DEFAULT ARRAY[1, 3, 7, 15, 30]::INTEGER[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
