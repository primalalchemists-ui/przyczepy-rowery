import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_dodatki_pricing_type" AS ENUM('perBooking', 'perDay');
  CREATE TYPE "public"."enum_rezerwacje_snapshot_extras_snapshot_pricing_type" AS ENUM('perBooking', 'perDay');
  CREATE TYPE "public"."enum_rezerwacje_status" AS ENUM('pending_payment', 'deposit_paid', 'paid', 'confirmed', 'cancelled');
  CREATE TYPE "public"."enum_platnosci_provider" AS ENUM('stripe', 'p24');
  CREATE TYPE "public"."enum_platnosci_status" AS ENUM('created', 'pending', 'succeeded', 'failed', 'refunded');
  CREATE TYPE "public"."enum_ustawienia_rezerwacji_payment_mode" AS ENUM('full', 'deposit');
  CREATE TYPE "public"."enum_ustawienia_rezerwacji_deposit_type" AS ENUM('percent', 'fixed');
  CREATE TYPE "public"."enum_ustawienia_rezerwacji_payment_provider_default" AS ENUM('stripe', 'p24');
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"caption" jsonb,
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
  
  CREATE TABLE "przyczepy_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "przyczepy_specyfikacja_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "przyczepy_specyfikacja" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "przyczepy_cena_seasonal_pricing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"date_from" timestamp(3) with time zone NOT NULL,
  	"date_to" timestamp(3) with time zone NOT NULL,
  	"price_per_night" numeric NOT NULL,
  	"min_nights" numeric
  );
  
  CREATE TABLE "przyczepy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nazwa" varchar NOT NULL,
  	"slug" varchar,
  	"active" boolean DEFAULT true NOT NULL,
  	"ilosc_sztuk" numeric DEFAULT 1 NOT NULL,
  	"opis_krotki" varchar,
  	"opis_dlugi" jsonb,
  	"hero_image_id" integer NOT NULL,
  	"cena_base_price_per_night" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "przyczepy_rels" (
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
  
  CREATE TABLE "rezerwacje_snapshot_lodging_breakdown" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"nights" numeric NOT NULL,
  	"price_per_night" numeric NOT NULL,
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
  	"przyczepa_id" integer NOT NULL,
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
  	"snapshot_nights" numeric,
  	"snapshot_price_per_night" numeric,
  	"snapshot_standard_nights" numeric,
  	"snapshot_seasonal_nights" numeric,
  	"snapshot_service_fee" numeric,
  	"snapshot_total" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blokady" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"przyczepa_id" integer NOT NULL,
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
  	"przyczepy_id" integer,
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
  	"min_nights_default" numeric DEFAULT 1 NOT NULL,
  	"service_fee" numeric DEFAULT 0 NOT NULL,
  	"payment_mode" "enum_ustawienia_rezerwacji_payment_mode" DEFAULT 'full' NOT NULL,
  	"deposit_type" "enum_ustawienia_rezerwacji_deposit_type" DEFAULT 'percent',
  	"deposit_value" numeric,
  	"regulamin_pdf_id" integer,
  	"polityka_prywatnosci_pdf_id" integer,
  	"payment_provider_default" "enum_ustawienia_rezerwacji_payment_provider_default" DEFAULT 'stripe' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "przyczepy_gallery" ADD CONSTRAINT "przyczepy_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "przyczepy_gallery" ADD CONSTRAINT "przyczepy_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."przyczepy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "przyczepy_specyfikacja_items" ADD CONSTRAINT "przyczepy_specyfikacja_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."przyczepy_specyfikacja"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "przyczepy_specyfikacja" ADD CONSTRAINT "przyczepy_specyfikacja_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."przyczepy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "przyczepy_cena_seasonal_pricing" ADD CONSTRAINT "przyczepy_cena_seasonal_pricing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."przyczepy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "przyczepy" ADD CONSTRAINT "przyczepy_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "przyczepy_rels" ADD CONSTRAINT "przyczepy_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."przyczepy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "przyczepy_rels" ADD CONSTRAINT "przyczepy_rels_dodatki_fk" FOREIGN KEY ("dodatki_id") REFERENCES "public"."dodatki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rezerwacje_extras" ADD CONSTRAINT "rezerwacje_extras_dodatek_id_dodatki_id_fk" FOREIGN KEY ("dodatek_id") REFERENCES "public"."dodatki"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rezerwacje_extras" ADD CONSTRAINT "rezerwacje_extras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rezerwacje"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rezerwacje_snapshot_lodging_breakdown" ADD CONSTRAINT "rezerwacje_snapshot_lodging_breakdown_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rezerwacje"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rezerwacje_snapshot_extras_snapshot" ADD CONSTRAINT "rezerwacje_snapshot_extras_snapshot_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rezerwacje"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rezerwacje" ADD CONSTRAINT "rezerwacje_przyczepa_id_przyczepy_id_fk" FOREIGN KEY ("przyczepa_id") REFERENCES "public"."przyczepy"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blokady" ADD CONSTRAINT "blokady_przyczepa_id_przyczepy_id_fk" FOREIGN KEY ("przyczepa_id") REFERENCES "public"."przyczepy"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "platnosci" ADD CONSTRAINT "platnosci_booking_id_rezerwacje_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."rezerwacje"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dodatki_fk" FOREIGN KEY ("dodatki_id") REFERENCES "public"."dodatki"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_przyczepy_fk" FOREIGN KEY ("przyczepy_id") REFERENCES "public"."przyczepy"("id") ON DELETE cascade ON UPDATE no action;
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
  CREATE INDEX "dodatki_name_idx" ON "dodatki" USING btree ("name");
  CREATE INDEX "dodatki_updated_at_idx" ON "dodatki" USING btree ("updated_at");
  CREATE INDEX "dodatki_created_at_idx" ON "dodatki" USING btree ("created_at");
  CREATE INDEX "przyczepy_gallery_order_idx" ON "przyczepy_gallery" USING btree ("_order");
  CREATE INDEX "przyczepy_gallery_parent_id_idx" ON "przyczepy_gallery" USING btree ("_parent_id");
  CREATE INDEX "przyczepy_gallery_image_idx" ON "przyczepy_gallery" USING btree ("image_id");
  CREATE INDEX "przyczepy_specyfikacja_items_order_idx" ON "przyczepy_specyfikacja_items" USING btree ("_order");
  CREATE INDEX "przyczepy_specyfikacja_items_parent_id_idx" ON "przyczepy_specyfikacja_items" USING btree ("_parent_id");
  CREATE INDEX "przyczepy_specyfikacja_order_idx" ON "przyczepy_specyfikacja" USING btree ("_order");
  CREATE INDEX "przyczepy_specyfikacja_parent_id_idx" ON "przyczepy_specyfikacja" USING btree ("_parent_id");
  CREATE INDEX "przyczepy_cena_seasonal_pricing_order_idx" ON "przyczepy_cena_seasonal_pricing" USING btree ("_order");
  CREATE INDEX "przyczepy_cena_seasonal_pricing_parent_id_idx" ON "przyczepy_cena_seasonal_pricing" USING btree ("_parent_id");
  CREATE INDEX "przyczepy_nazwa_idx" ON "przyczepy" USING btree ("nazwa");
  CREATE UNIQUE INDEX "przyczepy_slug_idx" ON "przyczepy" USING btree ("slug");
  CREATE INDEX "przyczepy_active_idx" ON "przyczepy" USING btree ("active");
  CREATE INDEX "przyczepy_ilosc_sztuk_idx" ON "przyczepy" USING btree ("ilosc_sztuk");
  CREATE INDEX "przyczepy_hero_image_idx" ON "przyczepy" USING btree ("hero_image_id");
  CREATE INDEX "przyczepy_updated_at_idx" ON "przyczepy" USING btree ("updated_at");
  CREATE INDEX "przyczepy_created_at_idx" ON "przyczepy" USING btree ("created_at");
  CREATE INDEX "przyczepy_rels_order_idx" ON "przyczepy_rels" USING btree ("order");
  CREATE INDEX "przyczepy_rels_parent_idx" ON "przyczepy_rels" USING btree ("parent_id");
  CREATE INDEX "przyczepy_rels_path_idx" ON "przyczepy_rels" USING btree ("path");
  CREATE INDEX "przyczepy_rels_dodatki_id_idx" ON "przyczepy_rels" USING btree ("dodatki_id");
  CREATE INDEX "rezerwacje_extras_order_idx" ON "rezerwacje_extras" USING btree ("_order");
  CREATE INDEX "rezerwacje_extras_parent_id_idx" ON "rezerwacje_extras" USING btree ("_parent_id");
  CREATE INDEX "rezerwacje_extras_dodatek_idx" ON "rezerwacje_extras" USING btree ("dodatek_id");
  CREATE INDEX "rezerwacje_snapshot_lodging_breakdown_order_idx" ON "rezerwacje_snapshot_lodging_breakdown" USING btree ("_order");
  CREATE INDEX "rezerwacje_snapshot_lodging_breakdown_parent_id_idx" ON "rezerwacje_snapshot_lodging_breakdown" USING btree ("_parent_id");
  CREATE INDEX "rezerwacje_snapshot_extras_snapshot_order_idx" ON "rezerwacje_snapshot_extras_snapshot" USING btree ("_order");
  CREATE INDEX "rezerwacje_snapshot_extras_snapshot_parent_id_idx" ON "rezerwacje_snapshot_extras_snapshot" USING btree ("_parent_id");
  CREATE INDEX "rezerwacje_przyczepa_idx" ON "rezerwacje" USING btree ("przyczepa_id");
  CREATE INDEX "rezerwacje_start_date_idx" ON "rezerwacje" USING btree ("start_date");
  CREATE INDEX "rezerwacje_end_date_idx" ON "rezerwacje" USING btree ("end_date");
  CREATE INDEX "rezerwacje_status_idx" ON "rezerwacje" USING btree ("status");
  CREATE INDEX "rezerwacje_updated_at_idx" ON "rezerwacje" USING btree ("updated_at");
  CREATE INDEX "rezerwacje_created_at_idx" ON "rezerwacje" USING btree ("created_at");
  CREATE INDEX "blokady_przyczepa_idx" ON "blokady" USING btree ("przyczepa_id");
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
  CREATE INDEX "payload_locked_documents_rels_przyczepy_id_idx" ON "payload_locked_documents_rels" USING btree ("przyczepy_id");
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
  DROP TABLE "dodatki" CASCADE;
  DROP TABLE "przyczepy_gallery" CASCADE;
  DROP TABLE "przyczepy_specyfikacja_items" CASCADE;
  DROP TABLE "przyczepy_specyfikacja" CASCADE;
  DROP TABLE "przyczepy_cena_seasonal_pricing" CASCADE;
  DROP TABLE "przyczepy" CASCADE;
  DROP TABLE "przyczepy_rels" CASCADE;
  DROP TABLE "rezerwacje_extras" CASCADE;
  DROP TABLE "rezerwacje_snapshot_lodging_breakdown" CASCADE;
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
  DROP TYPE "public"."enum_dodatki_pricing_type";
  DROP TYPE "public"."enum_rezerwacje_snapshot_extras_snapshot_pricing_type";
  DROP TYPE "public"."enum_rezerwacje_status";
  DROP TYPE "public"."enum_platnosci_provider";
  DROP TYPE "public"."enum_platnosci_status";
  DROP TYPE "public"."enum_ustawienia_rezerwacji_payment_mode";
  DROP TYPE "public"."enum_ustawienia_rezerwacji_deposit_type";
  DROP TYPE "public"."enum_ustawienia_rezerwacji_payment_provider_default";`)
}
