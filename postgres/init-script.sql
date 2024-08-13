-- Create the extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS dblink;

ALTER USER postgres WITH SUPERUSER;

-- Create a table to store query logs
CREATE TABLE IF NOT EXISTS query_logs (
    id SERIAL PRIMARY KEY,
    database_name TEXT,
    query_text TEXT,
    execution_time INTERVAL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a function to log queries
CREATE OR REPLACE FUNCTION log_query() RETURNS event_trigger AS $$
DECLARE
    query_text TEXT;
    execution_time INTERVAL;
BEGIN
    SELECT current_query() INTO query_text;
    SELECT clock_timestamp() - statement_timestamp() INTO execution_time;
    INSERT INTO query_logs (database_name, query_text, execution_time)
    VALUES (current_database(), query_text, execution_time);
END;
$$ LANGUAGE plpgsql;

-- Create an event trigger that calls the logging function
DROP EVENT TRIGGER IF EXISTS query_logger;
CREATE EVENT TRIGGER query_logger ON ddl_command_end
    EXECUTE FUNCTION log_query();

-- Create a restricted role for users (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'restricted_user') THEN
        CREATE ROLE restricted_user;
    END IF;
END
$$;

REVOKE CREATE ON SCHEMA public FROM restricted_user;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM restricted_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO restricted_user;
