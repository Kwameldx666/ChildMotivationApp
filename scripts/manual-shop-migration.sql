CREATE TABLE IF NOT EXISTS "products" (
    "Id" uuid NOT NULL,
    "Name" varchar(200) NOT NULL,
    "Description" varchar(2000),
    "Price" numeric(12,2) NOT NULL,
    "Stock" integer NOT NULL DEFAULT 0,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamptz NOT NULL,
    CONSTRAINT "PK_products" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "orders" (
    "Id" uuid NOT NULL,
    "UserId" varchar(64) NOT NULL,
    "CreatedAt" timestamptz NOT NULL,
    "Status" integer NOT NULL DEFAULT 0,
    "TotalAmount" numeric(12,2) NOT NULL,
    CONSTRAINT "PK_orders" PRIMARY KEY ("Id")
);

CREATE TABLE IF NOT EXISTS "order_items" (
    "Id" uuid NOT NULL,
    "OrderId" uuid NOT NULL,
    "ProductId" uuid NOT NULL,
    "ProductName" varchar(200) NOT NULL,
    "UnitPrice" numeric(12,2) NOT NULL,
    "Quantity" integer NOT NULL,
    "LineTotal" numeric(12,2) NOT NULL,
    CONSTRAINT "PK_order_items" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_order_items_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "orders" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_order_items_products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "products" ("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_order_items_OrderId" ON "order_items" ("OrderId");
CREATE INDEX IF NOT EXISTS "IX_order_items_ProductId" ON "order_items" ("ProductId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260101000000_InitialCreate', '10.0.1')
ON CONFLICT ("MigrationId") DO NOTHING;
