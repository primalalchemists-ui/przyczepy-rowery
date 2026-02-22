import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rezerwacje"
      ADD COLUMN IF NOT EXISTS "klient_delivery_address" varchar;

    ALTER TABLE "rezerwacje"
      ADD COLUMN IF NOT EXISTS "klient_delivery_details" varchar;

    ALTER TABLE "rezerwacje"
      ADD COLUMN IF NOT EXISTS "klient_delivery_gps" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rezerwacje"
      DROP COLUMN IF EXISTS "klient_delivery_address";

    ALTER TABLE "rezerwacje"
      DROP COLUMN IF EXISTS "klient_delivery_details";

    ALTER TABLE "rezerwacje"
      DROP COLUMN IF EXISTS "klient_delivery_gps";
  `)
}
