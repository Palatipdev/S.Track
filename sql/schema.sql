-- S.Track — Postgres DDL
-- Apply in Supabase SQL editor (run once, top to bottom)

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE user_role      AS ENUM ('owner', 'buyer', 'onsite', 'factory', 'engineer');
CREATE TYPE project_status AS ENUM ('active', 'completed', 'on_hold');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE urgency_level  AS ENUM ('low', 'medium', 'high');
CREATE TYPE order_status   AS ENUM ('pending', 'delivered', 'cancelled');

-- ---------------------------------------------------------------------------
-- TENANT ROOT
-- ---------------------------------------------------------------------------

CREATE TABLE companies (
  id         bigint      NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id         bigint      NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id bigint      NOT NULL REFERENCES companies(id),
  email      text        NOT NULL,
  role       user_role   NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, email)
);

-- ---------------------------------------------------------------------------
-- PROJECTS
-- ---------------------------------------------------------------------------

CREATE TABLE projects (
  id         bigint         NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id bigint         NOT NULL REFERENCES companies(id),
  name       text           NOT NULL,
  budget     numeric(14,2)  NOT NULL,
  status     project_status NOT NULL DEFAULT 'active',
  start_date date           NOT NULL,
  end_date   date,
  deleted_at timestamptz,
  created_at timestamptz    NOT NULL DEFAULT now()
);

CREATE TABLE project_members (
  project_id bigint NOT NULL REFERENCES projects(id),
  user_id    bigint NOT NULL REFERENCES users(id),
  PRIMARY KEY (project_id, user_id)
);

-- ---------------------------------------------------------------------------
-- SUPPLIERS
-- ---------------------------------------------------------------------------

CREATE TABLE suppliers (
  id         bigint      NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id bigint      NOT NULL REFERENCES companies(id),
  name       text        NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- MATERIAL REQUESTS
-- ---------------------------------------------------------------------------

CREATE TABLE material_requests (
  id           bigint         NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id   bigint         NOT NULL REFERENCES companies(id),
  project_id   bigint         NOT NULL REFERENCES projects(id),
  requested_by bigint         NOT NULL REFERENCES users(id),
  status       request_status NOT NULL DEFAULT 'pending',
  urgency      urgency_level  NOT NULL DEFAULT 'medium',
  reason       text,
  approved_by  bigint         REFERENCES users(id),
  approved_at  timestamptz,
  deleted_at   timestamptz,
  created_at   timestamptz    NOT NULL DEFAULT now()
);

CREATE TABLE request_items (
  id                  bigint        NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  material_request_id bigint        NOT NULL REFERENCES material_requests(id),
  item_name           text          NOT NULL,
  quantity            numeric(14,2) NOT NULL,
  unit                text          NOT NULL
);

-- ---------------------------------------------------------------------------
-- PURCHASE ORDERS
-- ---------------------------------------------------------------------------

CREATE TABLE purchase_orders (
  id                  bigint        NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id          bigint        NOT NULL REFERENCES companies(id),
  material_request_id bigint        NOT NULL REFERENCES material_requests(id),
  supplier_id         bigint        NOT NULL REFERENCES suppliers(id),
  total_cost          numeric(14,2) NOT NULL,
  expected_delivery   date          NOT NULL,
  status              order_status  NOT NULL DEFAULT 'pending',
  deleted_at          timestamptz,
  created_at          timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id                bigint        NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  purchase_order_id bigint        NOT NULL REFERENCES purchase_orders(id),
  request_item_id   bigint        REFERENCES request_items(id),  -- the request line this order fulfills; NULL = ordered but never requested (fraud signal)
  item_name         text          NOT NULL,
  quantity          numeric(14,2) NOT NULL,
  unit              text          NOT NULL,
  unit_cost         numeric(14,2) NOT NULL
);

-- ---------------------------------------------------------------------------
-- DELIVERIES
-- ---------------------------------------------------------------------------

CREATE TABLE deliveries (
  id                bigint      NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id        bigint      NOT NULL REFERENCES companies(id),
  purchase_order_id bigint      NOT NULL REFERENCES purchase_orders(id),
  confirmed_by      bigint      NOT NULL REFERENCES users(id),
  gps_lat           numeric(9,6),
  gps_lng           numeric(9,6),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_items (
  id            bigint        NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  delivery_id   bigint        NOT NULL REFERENCES deliveries(id),
  order_item_id bigint        NOT NULL REFERENCES order_items(id),
  received_qty  numeric(14,2) NOT NULL
);

CREATE TABLE delivery_photos (
  id                 bigint      NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  delivery_id        bigint      NOT NULL REFERENCES deliveries(id),
  file_key           text        NOT NULL,
  sha256_hash        char(64)    NOT NULL,
  server_uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (delivery_id, sha256_hash)
);

-- ---------------------------------------------------------------------------
-- AUDIT LOGS (append-only — never UPDATE or DELETE these rows)
-- ---------------------------------------------------------------------------

CREATE TABLE request_events (
  id                  bigint      NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  material_request_id bigint      NOT NULL REFERENCES material_requests(id),
  actor_id            bigint      NOT NULL REFERENCES users(id),
  event_type          text        NOT NULL,
  payload             jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_events (
  id                bigint      NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  purchase_order_id bigint      NOT NULL REFERENCES purchase_orders(id),
  actor_id          bigint      NOT NULL REFERENCES users(id),
  event_type        text        NOT NULL,
  payload           jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_events (
  id          bigint      NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  delivery_id bigint      NOT NULL REFERENCES deliveries(id),
  actor_id    bigint      NOT NULL REFERENCES users(id),
  event_type  text        NOT NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
