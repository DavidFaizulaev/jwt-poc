CREATE TABLE IF NOT EXISTS idempotency_table(
     idempotency_key text,
     merchant_id text,
     status_code int,
     body text,
     payment_storage_data text,
     created timestamp,
     updated timestamp,
     PRIMARY KEY (idempotency_key, merchant_id))
WITH default_time_to_live = 86400;
