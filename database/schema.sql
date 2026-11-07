CREATE TABLE roles (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id       INT NOT NULL REFERENCES roles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE items (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) UNIQUE NOT NULL,
  item_type       VARCHAR(10) NOT NULL CHECK (item_type IN ('RAW', 'FINISHED')),
  unit            VARCHAR(20) NOT NULL,
  quantity        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  price           NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  low_stock_limit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (low_stock_limit >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stock_history (
  id            SERIAL PRIMARY KEY,
  item_id       INT NOT NULL REFERENCES items(id),
  change_qty    NUMERIC(12,2) NOT NULL CHECK (change_qty <> 0),
  balance_after NUMERIC(12,2) NOT NULL,
  changed_via   VARCHAR(30) NOT NULL,
  reason        TEXT,
  changed_by    INT NOT NULL REFERENCES users(id),
  request_id    VARCHAR(64),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, item_id)
);

INSERT INTO roles (name) VALUES ('Admin'), ('Manager'), ('Worker');
CREATE TABLE orders (
  id                 SERIAL PRIMARY KEY,
  order_type         VARCHAR(10) NOT NULL CHECK (order_type IN ('SALES', 'PURCHASE')),
  party_name         VARCHAR(150) NOT NULL,
  order_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date           DATE,
  invoice_status     VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (invoice_status IN ('Pending', 'Created')),
  invoice_created_at TIMESTAMPTZ,
  goods_status       VARCHAR(25) NOT NULL DEFAULT 'Not Dispatched'
                     CHECK (goods_status IN ('Not Dispatched', 'Partially Dispatched', 'Dispatched')),
  total_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_by         INT NOT NULL REFERENCES users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id       INT NOT NULL REFERENCES items(id),
  quantity      NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  price         NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  fulfilled_qty NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (fulfilled_qty >= 0 AND fulfilled_qty <= quantity),
  UNIQUE (order_id, item_id)
);

CREATE TABLE bom_lines (
  id               SERIAL PRIMARY KEY,
  finished_item_id INT NOT NULL REFERENCES items(id),
  raw_item_id      INT NOT NULL REFERENCES items(id),
  qty_per_unit     NUMERIC(12,3) NOT NULL CHECK (qty_per_unit > 0),
  UNIQUE (finished_item_id, raw_item_id),
  CHECK (finished_item_id <> raw_item_id)
);

CREATE TABLE production_orders (
  id               SERIAL PRIMARY KEY,
  finished_item_id INT NOT NULL REFERENCES items(id),
  target_qty       NUMERIC(12,2) NOT NULL CHECK (target_qty > 0),
  completed_qty    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (completed_qty >= 0 AND completed_qty <= target_qty),
  status           VARCHAR(15) NOT NULL DEFAULT 'PLANNED'
                   CHECK (status IN ('PLANNED', 'PENDING', 'WIP', 'IN-TESTING', 'COMPLETED')),
  planned_date     DATE,
  total_cost       NUMERIC(14,2),
  created_by       INT NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ
);

ALTER TABLE stock_history ADD COLUMN order_id INT REFERENCES orders(id);
ALTER TABLE stock_history ADD COLUMN production_order_id INT REFERENCES production_orders(id);