-- La fecha histórica se interpreta como UTC.
SET TIME ZONE 'UTC';

ALTER TABLE "cards"
  ALTER COLUMN "proximaRevision" TYPE DATE
  USING (("proximaRevision" AT TIME ZONE 'UTC')::date);

ALTER TABLE "cards"
  ALTER COLUMN "proximaRevision" SET DEFAULT CURRENT_DATE;

ALTER TABLE "user_settings"
  ADD COLUMN "timezone" TEXT;
