import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1) ENUM (idempotent)
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_rezerwacje_klient_invoice_type" AS ENUM ('none', 'personal', 'company');
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END $$;

    -- 2) FAQ table (idempotent)
    CREATE TABLE IF NOT EXISTS "ustawienia_rezerwacji_faq" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar NOT NULL,
      "answer" varchar NOT NULL,
      "order" numeric
    );

    -- 3) Drop indexes (idempotent)
    DROP INDEX IF EXISTS "media_sizes_square_sizes_square_filename_idx";
    DROP INDEX IF EXISTS "media_sizes_small_sizes_small_filename_idx";
    DROP INDEX IF EXISTS "media_sizes_xlarge_sizes_xlarge_filename_idx";
    DROP INDEX IF EXISTS "media_sizes_og_sizes_og_filename_idx";

    -- 4) Column type change (safe)
    ALTER TABLE "zasoby_specyfikacja"
      ALTER COLUMN "value" SET DATA TYPE jsonb
      USING
        CASE
          WHEN "value" IS NULL THEN NULL
          ELSE "value"::jsonb
        END;

    -- 5) Add columns to rezerwacje (idempotent)
    ALTER TABLE "rezerwacje"
      ADD COLUMN IF NOT EXISTS "klient_invoice_type" "public"."enum_rezerwacje_klient_invoice_type" DEFAULT 'none';

    ALTER TABLE "rezerwacje"
      ADD COLUMN IF NOT EXISTS "klient_company_name" varchar;

    ALTER TABLE "rezerwacje"
      ADD COLUMN IF NOT EXISTS "klient_company_address" varchar;

    -- 6) FK (idempotent)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ustawienia_rezerwacji_faq_parent_id_fk'
      ) THEN
        ALTER TABLE "ustawienia_rezerwacji_faq"
          ADD CONSTRAINT "ustawienia_rezerwacji_faq_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."ustawienia_rezerwacji"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
      END IF;
    END $$;

    -- 7) Indexes (idempotent)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = 'ustawienia_rezerwacji_faq_order_idx'
      ) THEN
        CREATE INDEX "ustawienia_rezerwacji_faq_order_idx" ON "ustawienia_rezerwacji_faq" USING btree ("_order");
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = 'ustawienia_rezerwacji_faq_parent_id_idx'
      ) THEN
        CREATE INDEX "ustawienia_rezerwacji_faq_parent_id_idx" ON "ustawienia_rezerwacji_faq" USING btree ("_parent_id");
      END IF;
    END $$;

    -- 8) Drop media columns (idempotent)
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_url";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_width";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_height";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_mime_type";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_filesize";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_filename";

    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_url";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_width";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_height";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_mime_type";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_filesize";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_filename";

    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_url";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_width";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_height";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_mime_type";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_filesize";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_filename";

    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_url";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_width";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_height";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_mime_type";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_filesize";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_filename";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- (down) zwykle używa się tylko w dev; tu też robimy bezpiecznie

    DROP TABLE IF EXISTS "ustawienia_rezerwacji_faq" CASCADE;

    -- revert jsonb -> varchar (best-effort)
    ALTER TABLE "zasoby_specyfikacja"
      ALTER COLUMN "value" SET DATA TYPE varchar
      USING
        CASE
          WHEN "value" IS NULL THEN NULL
          ELSE "value"::text
        END;

    -- restore media columns (idempotent)
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_url" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_width" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_height" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_mime_type" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_filesize" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_square_filename" varchar;

    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_url" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_width" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_height" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_mime_type" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_filesize" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_small_filename" varchar;

    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_url" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_width" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_height" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_mime_type" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_filesize" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_xlarge_filename" varchar;

    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_url" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_width" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_height" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_mime_type" varchar;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_filesize" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "sizes_og_filename" varchar;

    -- recreate indexes (idempotent)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname='public' AND indexname='media_sizes_square_sizes_square_filename_idx'
      ) THEN
        CREATE INDEX "media_sizes_square_sizes_square_filename_idx" ON "media" USING btree ("sizes_square_filename");
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname='public' AND indexname='media_sizes_small_sizes_small_filename_idx'
      ) THEN
        CREATE INDEX "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname='public' AND indexname='media_sizes_xlarge_sizes_xlarge_filename_idx'
      ) THEN
        CREATE INDEX "media_sizes_xlarge_sizes_xlarge_filename_idx" ON "media" USING btree ("sizes_xlarge_filename");
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname='public' AND indexname='media_sizes_og_sizes_og_filename_idx'
      ) THEN
        CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
      END IF;
    END $$;

    -- drop columns from rezerwacje (idempotent)
    ALTER TABLE "rezerwacje" DROP COLUMN IF EXISTS "klient_invoice_type";
    ALTER TABLE "rezerwacje" DROP COLUMN IF EXISTS "klient_company_name";
    ALTER TABLE "rezerwacje" DROP COLUMN IF EXISTS "klient_company_address";

    -- drop enum type (idempotent)
    DROP TYPE IF EXISTS "public"."enum_rezerwacje_klient_invoice_type";
  `)
}
