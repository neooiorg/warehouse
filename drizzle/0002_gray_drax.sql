CREATE TYPE "public"."fuel_type" AS ENUM('RON95', 'RON92', 'DO', 'DIESEL');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'fulfilled', 'cancelled');--> statement-breakpoint
CREATE TABLE "kpi_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"role" text NOT NULL,
	"kpi_name" text NOT NULL,
	"formula" text,
	"target" double precision,
	"unit" text,
	"weight" double precision DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staffing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid,
	"plan_date" date NOT NULL,
	"daily_volume" integer DEFAULT 0 NOT NULL,
	"work_hours_per_shift" double precision DEFAULT 8 NOT NULL,
	"input_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"estimated_minutes" integer DEFAULT 0 NOT NULL,
	"required_role" text,
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuel_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region" text DEFAULT 'national' NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"price_vnd" integer NOT NULL,
	"effective_date" date NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"sku_id" uuid,
	"qty_required" double precision NOT NULL,
	"destination_lat" double precision,
	"destination_lng" double precision,
	"destination_address" text,
	"request_date" date NOT NULL,
	"status" "shipment_status" DEFAULT 'pending' NOT NULL,
	"resolved_warehouse_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dock_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid,
	"schedule_date" text NOT NULL,
	"forklifts_count" integer DEFAULT 1 NOT NULL,
	"minutes_per_pallet" double precision DEFAULT 5 NOT NULL,
	"input_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid,
	"employee_id" uuid,
	"task_type_id" uuid,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"qty" double precision DEFAULT 0 NOT NULL,
	"unit" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staffing_plans" ADD CONSTRAINT "staffing_plans_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_requests" ADD CONSTRAINT "shipment_requests_sku_id_product_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_requests" ADD CONSTRAINT "shipment_requests_resolved_warehouse_id_warehouses_id_fk" FOREIGN KEY ("resolved_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dock_schedules" ADD CONSTRAINT "dock_schedules_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_logs" ADD CONSTRAINT "task_logs_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_logs" ADD CONSTRAINT "task_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_logs" ADD CONSTRAINT "task_logs_task_type_id_workflow_tasks_id_fk" FOREIGN KEY ("task_type_id") REFERENCES "public"."workflow_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kpi_templates_org_id_idx" ON "kpi_templates" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "kpi_templates_role_idx" ON "kpi_templates" USING btree ("role");--> statement-breakpoint
CREATE INDEX "staffing_plans_org_id_idx" ON "staffing_plans" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "staffing_plans_warehouse_id_idx" ON "staffing_plans" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "workflow_tasks_org_id_idx" ON "workflow_tasks" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "fuel_prices_fuel_type_idx" ON "fuel_prices" USING btree ("fuel_type");--> statement-breakpoint
CREATE INDEX "fuel_prices_effective_date_idx" ON "fuel_prices" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "shipment_requests_org_id_idx" ON "shipment_requests" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "shipment_requests_status_idx" ON "shipment_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dock_schedules_org_id_idx" ON "dock_schedules" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "dock_schedules_warehouse_id_idx" ON "dock_schedules" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "task_logs_org_id_idx" ON "task_logs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "task_logs_employee_id_idx" ON "task_logs" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "task_logs_warehouse_id_idx" ON "task_logs" USING btree ("warehouse_id");