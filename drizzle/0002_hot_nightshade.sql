CREATE TYPE "public"."dock_appointment_status" AS ENUM('scheduled', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."staffing_plan_status" AS ENUM('draft', 'active');--> statement-breakpoint
CREATE TYPE "public"."delivery_order_status" AS ENUM('pending', 'planned', 'dispatched', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('ron95', 'ron92', 'diesel', 'e5');--> statement-breakpoint
CREATE TABLE "dock_appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"dock_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"direction" "dock_direction" NOT NULL,
	"pallet_count" integer,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"actual_start" timestamp with time zone,
	"actual_end" timestamp with time zone,
	"status" "dock_appointment_status" DEFAULT 'scheduled' NOT NULL,
	"processing_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forklift_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"avg_minutes_per_pallet" real DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slotting_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"moved_count" integer DEFAULT 0 NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staffing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid,
	"name" text NOT NULL,
	"available_headcount" integer DEFAULT 1 NOT NULL,
	"status" "staffing_plan_status" DEFAULT 'draft' NOT NULL,
	"critical_path_hours" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"name" text NOT NULL,
	"duration_hours" real NOT NULL,
	"predecessor_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_headcount" integer DEFAULT 1 NOT NULL,
	"assigned_employee_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"early_start" real,
	"early_finish" real,
	"late_start" real,
	"late_finish" real,
	"total_float" real,
	"is_critical" integer DEFAULT 0 NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid,
	"destination" text NOT NULL,
	"destination_lat" double precision,
	"destination_lng" double precision,
	"required_skus" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_date" date,
	"status" "delivery_order_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuel_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text,
	"fuel_type" "fuel_type" NOT NULL,
	"price_per_liter" numeric(10, 2) NOT NULL,
	"effective_date" date NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"route_warehouse_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_distance_km" double precision,
	"estimated_hours" double precision,
	"fuel_cost_estimate" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "pos_x" integer;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "pos_y" integer;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "pos_width" integer;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "pos_height" integer;--> statement-breakpoint
ALTER TABLE "dock_appointments" ADD CONSTRAINT "dock_appointments_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dock_appointments" ADD CONSTRAINT "dock_appointments_dock_id_docks_id_fk" FOREIGN KEY ("dock_id") REFERENCES "public"."docks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forklift_configs" ADD CONSTRAINT "forklift_configs_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slotting_runs" ADD CONSTRAINT "slotting_runs_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffing_plans" ADD CONSTRAINT "staffing_plans_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_plan_id_staffing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."staffing_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_plans" ADD CONSTRAINT "shipment_plans_order_id_delivery_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."delivery_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_plans" ADD CONSTRAINT "shipment_plans_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dock_appointments_org_id_idx" ON "dock_appointments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "dock_appointments_warehouse_id_idx" ON "dock_appointments" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "dock_appointments_dock_id_idx" ON "dock_appointments" USING btree ("dock_id");--> statement-breakpoint
CREATE INDEX "dock_appointments_scheduled_start_idx" ON "dock_appointments" USING btree ("scheduled_start");--> statement-breakpoint
CREATE INDEX "slotting_runs_org_id_idx" ON "slotting_runs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "slotting_runs_warehouse_id_idx" ON "slotting_runs" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "slotting_runs_run_at_idx" ON "slotting_runs" USING btree ("run_at");--> statement-breakpoint
CREATE INDEX "staffing_plans_org_id_idx" ON "staffing_plans" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "staffing_plans_warehouse_id_idx" ON "staffing_plans" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "work_tasks_org_id_idx" ON "work_tasks" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "work_tasks_plan_id_idx" ON "work_tasks" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "delivery_orders_org_id_idx" ON "delivery_orders" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "delivery_orders_status_idx" ON "delivery_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fuel_prices_fuel_type_idx" ON "fuel_prices" USING btree ("fuel_type");--> statement-breakpoint
CREATE INDEX "fuel_prices_effective_date_idx" ON "fuel_prices" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "shipment_plans_org_id_idx" ON "shipment_plans" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "shipment_plans_order_id_idx" ON "shipment_plans" USING btree ("order_id");