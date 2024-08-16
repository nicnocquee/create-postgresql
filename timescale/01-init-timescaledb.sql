-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create the database_creation_logs table
CREATE TABLE database_creation_logs (
    time TIMESTAMPTZ NOT NULL,
    db_name TEXT NOT NULL
);

-- Convert the table into a hypertable
SELECT create_hypertable('database_creation_logs', 'time');

-- Create an index for faster queries
CREATE INDEX ON database_creation_logs (db_name, time DESC);
