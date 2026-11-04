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