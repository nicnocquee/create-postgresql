-- Administrative tasks
-- Check and create tablespace if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tablespace WHERE spcname = 'limited_space') THEN
        RAISE NOTICE 'Run the following commands manually: CREATE TABLESPACE limited_space LOCATION ''/var/lib/postgresql/data/limited_space''; ALTER TABLESPACE limited_space SET (max_size = ''10MB'');';
    END IF;
END
$$;
