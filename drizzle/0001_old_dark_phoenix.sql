CREATE TYPE "public"."inventory_lot_status" AS ENUM('available', 'reserved', 'depleted', 'damaged');--> statement-breakpoint
CREATE TYPE "public"."inventory_transaction_type" AS ENUM('inbound', 'outbound', 'transfer', 'adjustment');--> statement-breakpoint
CREATE TABLE "inventory_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"sku_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"location_id" uuid,
	"lot_no" text NOT NULL,
	"qty" double precision NOT NULL,
	"received_date" date NOT NULL,
	"expiry_date" date,
	"status" "inventory_lot_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" text NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"type" "inventory_transaction_type" NOT NULL,
	"sku_id" uuid NOT NULL,
	"lot_id" uuid,
	"qty" double precision NOT NULL,
	"from_location_id" uuid,
	"to_location_id" uuid,
	"performed_by" uuid,
	"note" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_sku_id_product_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_sku_id_product_skus_id_fk" FOREIGN KEY ("sku_id") REFERENCES "public"."product_skus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_lot_id_inventory_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."inventory_lots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_from_location_id_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_to_location_id_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_performed_by_employees_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_lots_org_id_idx" ON "inventory_lots" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "inventory_lots_sku_id_idx" ON "inventory_lots" USING btree ("sku_id");--> statement-breakpoint
CREATE INDEX "inventory_lots_warehouse_id_idx" ON "inventory_lots" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "inventory_lots_location_id_idx" ON "inventory_lots" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "inventory_lots_status_idx" ON "inventory_lots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_transactions_org_id_idx" ON "inventory_transactions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_warehouse_id_idx" ON "inventory_transactions" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_sku_id_idx" ON "inventory_transactions" USING btree ("sku_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_lot_id_idx" ON "inventory_transactions" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_occurred_at_idx" ON "inventory_transactions" USING btree ("occurred_at");