-- Smart Energy Monitor - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- meter_readings: raw IoT sensor data from ESP32+PZEM
-- ============================================================
CREATE TABLE IF NOT EXISTS meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voltage float NOT NULL,
  current float NOT NULL,
  power float NOT NULL,
  energy_kwh float NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_meter_readings_timestamp ON meter_readings(timestamp DESC);

-- ============================================================
-- daily_usage: aggregated daily energy and cost
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_usage (
  date date PRIMARY KEY,
  total_energy_kwh float NOT NULL DEFAULT 0,
  estimated_cost float NOT NULL DEFAULT 0
);

-- ============================================================
-- alerts: voltage spikes, current surges, anomalies
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,   -- VOLTAGE_SPIKE | CURRENT_SURGE | ANOMALY
  value float NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);

-- ============================================================
-- predictions: 7-day energy and cost forecast
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  date date PRIMARY KEY,
  predicted_energy float NOT NULL,
  predicted_cost float NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Enable Supabase Realtime on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE meter_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- ============================================================
-- Seed sample data for immediate UI preview (optional)
-- ============================================================
-- Insert demo readings (last 24 hours of data)
INSERT INTO meter_readings (voltage, current, power, energy_kwh, timestamp)
SELECT
  220 + (random() * 10 - 5),
  2.0 + (random() * 3),
  (2.0 + random() * 3) * (220 + random() * 10 - 5),
  0.5 + (random() * 3),
  now() - (interval '1 minute' * generate_series(1, 144))
;

-- Seed demo daily_usage (last 14 days)
INSERT INTO daily_usage (date, total_energy_kwh, estimated_cost)
SELECT
  CURRENT_DATE - n,
  4.0 + random() * 8,
  (4.0 + random() * 8) * 6
FROM generate_series(0, 13) n
ON CONFLICT (date) DO NOTHING;

-- Seed demo predictions (next 7 days)
INSERT INTO predictions (date, predicted_energy, predicted_cost)
SELECT
  CURRENT_DATE + n,
  5.0 + random() * 6,
  (5.0 + random() * 6) * 6
FROM generate_series(1, 7) n
ON CONFLICT (date) DO NOTHING;
