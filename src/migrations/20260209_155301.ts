import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_dodatki_dostepne_dla" AS ENUM('przyczepa', 'ebike');
  CREATE TYPE "public"."enum_dodatki_pricing_type" AS ENUM('perBooking', 'perDay');
  CREATE TYPE "public"."enum_zasoby_typ_zasobu" AS ENUM('przyczepa', 'ebike');
  CREATE TYPE "public"."enum_zasoby_ebike_typ" AS ENUM('mtb', 'city', 'trekking', 'gravel');
  CREATE TYPE "public"."enum_zasoby_cena_jednostka" AS ENUM('noc', 'dzien');
  CREATE TYPE "public"."enum_rezerwacje_snapshot_extras_snapshot_pricing_type" AS ENUM('perBooking', 'perDay');
  CREATE TYPE "public"."enum_rezerwacje_status" AS ENUM('pending_payment', 'deposit_paid', 'paid', 'confirmed', 'cancelled');
  CREATE TYPE "public"."enum_platnosci_provider" AS ENUM('stripe', 'p24');
  CREATE TYPE "public"."enum_platnosci_status" AS ENUM('created', 'pending', 'succeeded', 'failed', 'refunded');
  CREATE TYPE "public"."enum_ustawienia_rezerwacji_ogolne_payment_mode" AS ENUM('full', 'deposit');
  CREATE TYPE "public"."enum_ustawienia_rezerwacji_ogolne_deposit_type" AS ENUM('percent', 'fixed');
  CREATE TYPE "public"."enum_ustawienia_rezerwacji_payment_provider_default" AS ENUM('stripe', 'p24');
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"caption" jsonb,
  	"typ_pliku" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_square_url" varchar,
  	"sizes_square_width" numeric,
  	"sizes_square_height" numeric,
  	"sizes_square_mime_type" varchar,
  	"sizes_square_filesize" numeric,
  	"sizes_square_filename" varchar,
  	"sizes_small_url" varchar,
  	"sizes_small_width" numeric,
  	"sizes_small_height" numeric,
  	"sizes_small_mime_type" varchar,
  	"sizes_small_filesize" numeric,
  	"sizes_small_filename" varchar,
  	"sizes_medium_url" varchar,
  	"sizes_medium_width" numeric,
  	"sizes_medium_height" numeric,
  	"sizes_medium_mime_type" varchar,
  	"sizes_medium_filesize" numeric,
  	"sizes_medium_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar,
  	"sizes_xlarge_url" varchar,
  	"sizes_xlarge_width" numeric,
  	"sizes_xlarge_height" numeric,
  	"sizes_xlarge_mime_type" varchar,
  	"sizes_xlarge_filesize" numeric,
  	"sizes_xlarge_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "dodatki_dostepne_dla" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_dodatki_dostepne_dla",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "dodatki" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"pricing_type" "enum_dodatki_pricing_type" DEFAULT 'perBooking' NOT NULL,
  	"max_quantity" numeric DEFAULT 1 NOT NULL,
  	"active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "zasoby_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer NOT NULL
  );
  
  CREATE TABLE "zasoby_specyfikacja" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "zasoby_cena_seasonal_pricing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"date_from" timestamp(3) with time zone NOT NULL,
  	"date_to" timestamp(3) with time zone NOT NULL,
  	"price" numeric NOT NULL,
  	"min_units" numeric
  );
  
  CREATE TABLE "zasoby" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"typ_zasobu" "enum_zasoby_typ_zasobu" DEFAULT 'przyczepa' NOT NULL,
  	"nazwa" varchar NOT NULL,
  	"slug" varchar,
  	"active" boolean DEFAULT true NOT NULL,
  	"ilosc_sztuk" numeric DEFAULT 1 NOT NULL,
  	"opis_krotki" varchar,
  	"opis_dlugi" jsonb,
  	"hero_media_id" integer NOT NULL,
  	"przyczepa_dmc" varchar,
  	"przyczepa_ilosc_osob" numeric,
  	"ebike_marka" varchar,
  	"ebike_model" varchar,
  	"ebike_rozmiar_ramy" varchar,
  	"ebike_bateria_wh" numeric,
  	"ebike_zasieg_km" numeric,
  	"ebike_typ" "enum_zasoby_ebike_typ",
  	"cena_jednostka" "enum_zasoby_cena_jednostka" DEFAULT 'noc' NOT NULL,
  	"cena_base_price" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "zasoby_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"dodatki_id" integer
  );
  
  CREATE TABLE "rezerwacje_extras" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"dodatek_id" integer NOT NULL,
  	"quantity" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "rezerwacje_snapshot_breakdown" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"units" numeric NOT NULL,
  	"price_per_unit" numeric NOT NULL,
  	"total" numeric NOT NULL
  );
  
  CREATE TABLE "rezerwacje_snapshot_extras_snapshot" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"pricing_type" "enum_rezerwacje_snapshot_extras_snapshot_pricing_type" NOT NULL,
  	"unit_price" numeric NOT NULL,
  	"quantity" numeric NOT NULL,
  	"total" numeric NOT NULL
  );
  
  CREATE TABLE "rezerwacje" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"zasob_id" integer NOT NULL,
  	"ilosc" numeric DEFAULT 1 NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"status" "enum_rezerwacje_status" DEFAULT 'pending_payment' NOT NULL,
  	"klient_full_name" varchar NOT NULL,
  	"klient_email" varchar NOT NULL,
  	"klient_phone" varchar NOT NULL,
  	"klient_wants_invoice" boolean DEFAULT false,
  	"klient_nip" varchar,
  	"klient_notes" varchar,
  	"klient_disability" boolean DEFAULT false,
  	"payment_payable_now" numeric,
  	"payment_paid_amount" numeric,
  	"payment_due_amount" numeric,
  	"payment_paid_in_full" boolean,
  	"snapshot_units" numeric,
  	"snapshot_unit_type" varchar,
  	"snapshot_base_price" numeric,
  	"snapshot_service_fee" numeric,
  	"snapshot_total" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blokady" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"zasob_id" integer NOT NULL,
  	"date_from" timestamp(3) with time zone NOT NULL,
  	"date_to" timestamp(3) with time zone NOT NULL,
  	"ilosc" numeric DEFAULT 1 NOT NULL,
  	"komunikat" varchar,
  	"active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "platnosci" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"booking_id" integer NOT NULL,
  	"provider" "enum_platnosci_provider" NOT NULL,
  	"provider_session_id" varchar,
  	"transaction_id" varchar,
  	"amount" numeric NOT NULL,
  	"currency" varchar DEFAULT 'PLN' NOT NULL,
  	"status" "enum_platnosci_status" DEFAULT 'created' NOT NULL,
  	"paid_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"users_id" integer,
  	"dodatki_id" integer,
  	"zasoby_id" integer,
  	"rezerwacje_id" integer,
  	"blokady_id" integer,
  	"platnosci_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ustawienia_strony" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar NOT NULL,
  	"phone" varchar,
  	"email" varchar,
  	"address" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ustawienia_rezerwacji" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"booking_enabled" boolean DEFAULT true NOT NULL,
  	"ogolne_service_fee" numeric DEFAULT 0 NOT NULL,
  	"ogolne_payment_mode" "enum_ustawienia_rezerwacji_ogolne_payment_mode" DEFAULT 'full' NOT NULL,
  	"ogolne_deposit_type" "enum_ustawienia_rezerwacji_ogolne_deposit_type" DEFAULT 'percent',
  	"ogolne_deposit_value" numeric,
  	"dla_przyczep_min_units" numeric DEFAULT 1 NOT NULL,
  	"dla_przyczep_service_fee" numeric DEFAULT 0 NOT NULL,
  	"dla_rowerow_min_units" numeric DEFAULT 1 NOT NULL,
  	"dla_rowerow_service_fee" numeric DEFAULT 0 NOT NULL,
  	"regulamin_pdf_id" integer,
  	"polityka_prywatnosci_pdf_id" integer,
  	"payment_provider_default" "enum_ustawienia_rezerwacji_payment_provider_default" DEFAULT 'stripe' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dodatki_dostepne_dla" ADD CONSTRAINT "dodatki_dostepne_dla_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dodatki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "zasoby_gallery" ADD CONSTRAINT "zasoby_gallery_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "zasoby_gallery" ADD CONSTRAINT "zasoby_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."zasoby"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "zasoby_specyfikacja" ADD CONSTRAINT "zasoby_specyfikacja_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."zasoby"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "zasoby_cena_seasonal_pricing" ADD CONSTRAINT "zasoby_cena_seasonal_pricing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."zasoby"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "zasoby" ADD CONSTRAINT "zasoby_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "zasoby_rels" ADD CONSTRAINT "zasoby_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."zasoby"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "zasoby_rels" ADD CONSTRAINT "zasoby_rels_dodatki_fk" FOREIGN KEY ("dodatki_id") REFERENCES "public"."dodatki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rezerwacje_extras" ADD CONSTRAINT "rezerwacje_extras_dodatek_id_dodatki_id_fk" FOREIGN KEY ("dodatek_id") REFERENCES "public"."dodatki"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rezerwacje_extras" ADD CONSTRAINT "rezerwacje_extras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rezerwacje"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rezerwacje_snapshot_breakdown" ADD CONSTRAINT "rezerwacje_snapshot_breakdown_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rezerwacje"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rezerwacje_snapshot_extras_snapshot" ADD CONSTRAINT "rezerwacje_snapshot_extras_snapshot_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rezerwacje"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rezerwacje" ADD CONSTRAINT "rezerwacje_zasob_id_zasoby_id_fk" FOREIGN KEY ("zasob_id") REFERENCES "public"."zasoby"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blokady" ADD CONSTRAINT "blokady_zasob_id_zasoby_id_fk" FOREIGN KEY ("zasob_id") REFERENCES "public"."zasoby"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "platnosci" ADD CONSTRAINT "platnosci_booking_id_rezerwacje_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."rezerwacje"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dodatki_fk" FOREIGN KEY ("dodatki_id") REFERENCES "public"."dodatki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_zasoby_fk" FOREIGN KEY ("zasoby_id") REFERENCES "public"."zasoby"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rezerwacje_fk" FOREIGN KEY ("rezerwacje_id") REFERENCES "public"."rezerwacje"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blokady_fk" FOREIGN KEY ("blokady_id") REFERENCES "public"."blokady"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_platnosci_fk" FOREIGN KEY ("platnosci_id") REFERENCES "public"."platnosci"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ustawienia_rezerwacji" ADD CONSTRAINT "ustawienia_rezerwacji_regulamin_pdf_id_media_id_fk" FOREIGN KEY ("regulamin_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ustawienia_rezerwacji" ADD CONSTRAINT "ustawienia_rezerwacji_polityka_prywatnosci_pdf_id_media_id_fk" FOREIGN KEY ("polityka_prywatnosci_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_square_sizes_square_filename_idx" ON "media" USING btree ("sizes_square_filename");
  CREATE INDEX "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
  CREATE INDEX "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "media_sizes_xlarge_sizes_xlarge_filename_idx" ON "media" USING btree ("sizes_xlarge_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "dodatki_dostepne_dla_order_idx" ON "dodatki_dostepne_dla" USING btree ("order");
  CREATE INDEX "dodatki_dostepne_dla_parent_idx" ON "dodatki_dostepne_dla" USING btree ("parent_id");
  CREATE INDEX "dodatki_name_idx" ON "dodatki" USING btree ("name");
  CREATE INDEX "dodatki_updated_at_idx" ON "dodatki" USING btree ("updated_at");
  CREATE INDEX "dodatki_created_at_idx" ON "dodatki" USING btree ("created_at");
  CREATE INDEX "zasoby_gallery_order_idx" ON "zasoby_gallery" USING btree ("_order");
  CREATE INDEX "zasoby_gallery_parent_id_idx" ON "zasoby_gallery" USING btree ("_parent_id");
  CREATE INDEX "zasoby_gallery_media_idx" ON "zasoby_gallery" USING btree ("media_id");
  CREATE INDEX "zasoby_specyfikacja_order_idx" ON "zasoby_specyfikacja" USING btree ("_order");
  CREATE INDEX "zasoby_specyfikacja_parent_id_idx" ON "zasoby_specyfikacja" USING btree ("_parent_id");
  CREATE INDEX "zasoby_cena_seasonal_pricing_order_idx" ON "zasoby_cena_seasonal_pricing" USING btree ("_order");
  CREATE INDEX "zasoby_cena_seasonal_pricing_parent_id_idx" ON "zasoby_cena_seasonal_pricing" USING btree ("_parent_id");
  CREATE INDEX "zasoby_typ_zasobu_idx" ON "zasoby" USING btree ("typ_zasobu");
  CREATE INDEX "zasoby_nazwa_idx" ON "zasoby" USING btree ("nazwa");
  CREATE UNIQUE INDEX "zasoby_slug_idx" ON "zasoby" USING btree ("slug");
  CREATE INDEX "zasoby_active_idx" ON "zasoby" USING btree ("active");
  CREATE INDEX "zasoby_ilosc_sztuk_idx" ON "zasoby" USING btree ("ilosc_sztuk");
  CREATE INDEX "zasoby_hero_media_idx" ON "zasoby" USING btree ("hero_media_id");
  CREATE INDEX "zasoby_updated_at_idx" ON "zasoby" USING btree ("updated_at");
  CREATE INDEX "zasoby_created_at_idx" ON "zasoby" USING btree ("created_at");
  CREATE INDEX "zasoby_rels_order_idx" ON "zasoby_rels" USING btree ("order");
  CREATE INDEX "zasoby_rels_parent_idx" ON "zasoby_rels" USING btree ("parent_id");
  CREATE INDEX "zasoby_rels_path_idx" ON "zasoby_rels" USING btree ("path");
  CREATE INDEX "zasoby_rels_dodatki_id_idx" ON "zasoby_rels" USING btree ("dodatki_id");
  CREATE INDEX "rezerwacje_extras_order_idx" ON "rezerwacje_extras" USING btree ("_order");
  CREATE INDEX "rezerwacje_extras_parent_id_idx" ON "rezerwacje_extras" USING btree ("_parent_id");
  CREATE INDEX "rezerwacje_extras_dodatek_idx" ON "rezerwacje_extras" USING btree ("dodatek_id");
  CREATE INDEX "rezerwacje_snapshot_breakdown_order_idx" ON "rezerwacje_snapshot_breakdown" USING btree ("_order");
  CREATE INDEX "rezerwacje_snapshot_breakdown_parent_id_idx" ON "rezerwacje_snapshot_breakdown" USING btree ("_parent_id");
  CREATE INDEX "rezerwacje_snapshot_extras_snapshot_order_idx" ON "rezerwacje_snapshot_extras_snapshot" USING btree ("_order");
  CREATE INDEX "rezerwacje_snapshot_extras_snapshot_parent_id_idx" ON "rezerwacje_snapshot_extras_snapshot" USING btree ("_parent_id");
  CREATE INDEX "rezerwacje_zasob_idx" ON "rezerwacje" USING btree ("zasob_id");
  CREATE INDEX "rezerwacje_start_date_idx" ON "rezerwacje" USING btree ("start_date");
  CREATE INDEX "rezerwacje_end_date_idx" ON "rezerwacje" USING btree ("end_date");
  CREATE INDEX "rezerwacje_status_idx" ON "rezerwacje" USING btree ("status");
  CREATE INDEX "rezerwacje_updated_at_idx" ON "rezerwacje" USING btree ("updated_at");
  CREATE INDEX "rezerwacje_created_at_idx" ON "rezerwacje" USING btree ("created_at");
  CREATE INDEX "blokady_zasob_idx" ON "blokady" USING btree ("zasob_id");
  CREATE INDEX "blokady_date_from_idx" ON "blokady" USING btree ("date_from");
  CREATE INDEX "blokady_date_to_idx" ON "blokady" USING btree ("date_to");
  CREATE INDEX "blokady_active_idx" ON "blokady" USING btree ("active");
  CREATE INDEX "blokady_updated_at_idx" ON "blokady" USING btree ("updated_at");
  CREATE INDEX "blokady_created_at_idx" ON "blokady" USING btree ("created_at");
  CREATE INDEX "platnosci_booking_idx" ON "platnosci" USING btree ("booking_id");
  CREATE INDEX "platnosci_status_idx" ON "platnosci" USING btree ("status");
  CREATE INDEX "platnosci_updated_at_idx" ON "platnosci" USING btree ("updated_at");
  CREATE INDEX "platnosci_created_at_idx" ON "platnosci" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_dodatki_id_idx" ON "payload_locked_documents_rels" USING btree ("dodatki_id");
  CREATE INDEX "payload_locked_documents_rels_zasoby_id_idx" ON "payload_locked_documents_rels" USING btree ("zasoby_id");
  CREATE INDEX "payload_locked_documents_rels_rezerwacje_id_idx" ON "payload_locked_documents_rels" USING btree ("rezerwacje_id");
  CREATE INDEX "payload_locked_documents_rels_blokady_id_idx" ON "payload_locked_documents_rels" USING btree ("blokady_id");
  CREATE INDEX "payload_locked_documents_rels_platnosci_id_idx" ON "payload_locked_documents_rels" USING btree ("platnosci_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "ustawienia_rezerwacji_regulamin_pdf_idx" ON "ustawienia_rezerwacji" USING btree ("regulamin_pdf_id");
  CREATE INDEX "ustawienia_rezerwacji_polityka_prywatnosci_pdf_idx" ON "ustawienia_rezerwacji" USING btree ("polityka_prywatnosci_pdf_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "dodatki_dostepne_dla" CASCADE;
  DROP TABLE "dodatki" CASCADE;
  DROP TABLE "zasoby_gallery" CASCADE;
  DROP TABLE "zasoby_specyfikacja" CASCADE;
  DROP TABLE "zasoby_cena_seasonal_pricing" CASCADE;
  DROP TABLE "zasoby" CASCADE;
  DROP TABLE "zasoby_rels" CASCADE;
  DROP TABLE "rezerwacje_extras" CASCADE;
  DROP TABLE "rezerwacje_snapshot_breakdown" CASCADE;
  DROP TABLE "rezerwacje_snapshot_extras_snapshot" CASCADE;
  DROP TABLE "rezerwacje" CASCADE;
  DROP TABLE "blokady" CASCADE;
  DROP TABLE "platnosci" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "ustawienia_strony" CASCADE;
  DROP TABLE "ustawienia_rezerwacji" CASCADE;
  DROP TYPE "public"."enum_dodatki_dostepne_dla";
  DROP TYPE "public"."enum_dodatki_pricing_type";
  DROP TYPE "public"."enum_zasoby_typ_zasobu";
  DROP TYPE "public"."enum_zasoby_ebike_typ";
  DROP TYPE "public"."enum_zasoby_cena_jednostka";
  DROP TYPE "public"."enum_rezerwacje_snapshot_extras_snapshot_pricing_type";
  DROP TYPE "public"."enum_rezerwacje_status";
  DROP TYPE "public"."enum_platnosci_provider";
  DROP TYPE "public"."enum_platnosci_status";
  DROP TYPE "public"."enum_ustawienia_rezerwacji_ogolne_payment_mode";
  DROP TYPE "public"."enum_ustawienia_rezerwacji_ogolne_deposit_type";
  DROP TYPE "public"."enum_ustawienia_rezerwacji_payment_provider_default";`)
}
