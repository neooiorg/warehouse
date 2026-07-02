CREATE TYPE "public"."dock_direction" AS ENUM('inbound', 'outbound', 'both');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('floor', 'rack');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'terminated', 'on_leave');--> statement-breakpoint
CREATE TYPE "public"."lot_sort_field" AS ENUM('received_date', 'expiry_date');--> statement-breakpoint
CREATE TYPE "public"."sort_direction" AS ENUM('asc', 'desc');--> statement-breakpoint
CREATE TYPE "public"."notification_source" AS ENUM('reslotting', 'fuel_price', 'staffing', 'transportation', 'system');--> statement-breakpoint
CREATE TABLE "docks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"code" text NOT NULL,
	"direction" "dock_direction" DEFAULT 'both' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"zone_id" uuid,
	"code" text NOT NULL,
	"type" "location_type" DEFAULT 'rack' NOT NULL,
	"level" integer,
	"capacity_volume" double precision,
	"capacity_weight" double precision,
	"distance_to_dock" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid,
	"full_name" text NOT NULL,
	"role" text,
	"department" text,
	"hire_date" date NOT NULL,
	"termination_date" date,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_skus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"unit" text DEFAULT 'unit' NOT NULL,
	"weight" double precision,
	"volume" double precision,
	"storage_class_label" text DEFAULT 'FIFO' NOT NULL,
	"allocation_sort_field" "lot_sort_field" DEFAULT 'received_date' NOT NULL,
	"allocation_sort_direction" "sort_direction" DEFAULT 'asc' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"plate_number" text NOT NULL,
	"type" text,
	"capacity_weight" double precision,
	"capacity_volume" double precision,
	"home_warehouse_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid,
	"target_user_id" text,
	"source_type" "notification_source" DEFAULT 'system' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "docks" ADD CONSTRAINT "docks_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_home_warehouse_id_warehouses_id_fk" FOREIGN KEY ("home_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "docks_org_id_idx" ON "docks" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "docks_warehouse_id_idx" ON "docks" USING btree ("warehouse_id");--> statement-breakpoint
CREATE UNIQUE INDEX "docks_warehouse_code_idx" ON "docks" USING btree ("warehouse_id","code");--> statement-breakpoint
CREATE INDEX "locations_org_id_idx" ON "locations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "locations_warehouse_id_idx" ON "locations" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "locations_zone_id_idx" ON "locations" USING btree ("zone_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_warehouse_code_idx" ON "locations" USING btree ("warehouse_id","code");--> statement-breakpoint
CREATE INDEX "warehouses_org_id_idx" ON "warehouses" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "warehouses_org_code_idx" ON "warehouses" USING btree ("org_id","code");--> statement-breakpoint
CREATE INDEX "zones_org_id_idx" ON "zones" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "zones_warehouse_id_idx" ON "zones" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "employees_org_id_idx" ON "employees" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "employees_warehouse_id_idx" ON "employees" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_skus_org_id_idx" ON "product_skus" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_skus_org_sku_idx" ON "product_skus" USING btree ("org_id","sku");--> statement-breakpoint
CREATE INDEX "vehicles_org_id_idx" ON "vehicles" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "vehicles_home_warehouse_id_idx" ON "vehicles" USING btree ("home_warehouse_id");--> statement-breakpoint
CREATE INDEX "notifications_org_id_idx" ON "notifications" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "notifications_target_user_id_idx" ON "notifications" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "notifications_warehouse_id_idx" ON "notifications" USING btree ("warehouse_id");