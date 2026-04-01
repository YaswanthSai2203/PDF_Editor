-- Annotation payload uses JSON in this architecture.
-- Aligns migration state for environments created before this schema commit.
ALTER TABLE "Annotation"
  ALTER COLUMN "payloadJson" DROP DEFAULT;
