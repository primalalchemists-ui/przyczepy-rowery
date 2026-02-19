import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rezerwacje" ADD COLUMN "reservation_number" varchar;
  CREATE UNIQUE INDEX "rezerwacje_reservation_number_idx" ON "rezerwacje" USING btree ("reservation_number");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "rezerwacje_reservation_number_idx";
  ALTER TABLE "rezerwacje" DROP COLUMN "reservation_number";`)
}
