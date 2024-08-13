const { Pool, Client } = require('pg');
const crypto = require('crypto');

const pools = {};

function generatePassword(length = 16) {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  while (password.length < length) {
    const byte = crypto.randomBytes(1)[0];
    const index = byte % charset.length;
    password += charset[index];
  }
  return password;
}

async function getPool(dbName, username, password) {
  if (!pools[dbName]) {
    const connectionString = `${process.env.DATABASE_URL.split('/')
      .slice(0, -1)
      .join('/')}/${dbName}`;
    pools[dbName] = new Pool({
      connectionString,
      user: username,
      password,
    });
  }
  return pools[dbName];
}

async function setupDatabase(dbName, username) {
  const setupConnectionString = `${process.env.DATABASE_URL.split('/')
    .slice(0, -1)
    .join('/')}/${dbName}`;
  const setupClient = new Client({
    connectionString: setupConnectionString,
  });
  await setupClient.connect();

  try {
    // Set up schema permissions
    await setupClient.query(`
      REVOKE ALL ON SCHEMA public FROM PUBLIC;
      GRANT ALL ON SCHEMA public TO ${username};
      ALTER DEFAULT PRIVILEGES FOR USER ${username} IN SCHEMA public
      GRANT ALL ON TABLES TO ${username};
    `);

    // Set up size check function
    await setupClient.query(`
      CREATE OR REPLACE FUNCTION check_database_size() RETURNS TRIGGER AS $$
      DECLARE
        db_size BIGINT;
      BEGIN
        SELECT pg_database_size(current_database()) INTO db_size;
        IF db_size > 10 * 1024 * 1024 THEN -- 10MB in bytes
          RAISE EXCEPTION 'Database size limit (10MB) exceeded. Current size: % bytes', db_size;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Set up a function to create the trigger on all existing and future tables
    await setupClient.query(`
      CREATE OR REPLACE FUNCTION create_size_check_trigger_for_table(full_table_name text) RETURNS void AS $$
      DECLARE
        schema_name text;
        table_name text;
      BEGIN
        -- Split the full_table_name into schema and table
        SELECT split_part(full_table_name, '.', 1), split_part(full_table_name, '.', 2)
        INTO schema_name, table_name;
        
        -- If there's no schema specified, assume it's public
        IF table_name = '' THEN
          table_name := schema_name;
          schema_name := 'public';
        END IF;

        EXECUTE format('
          CREATE TRIGGER check_size_trigger
          AFTER INSERT OR UPDATE OR DELETE ON %I.%I
          FOR EACH STATEMENT
          EXECUTE FUNCTION check_database_size()',
          schema_name, table_name
        );
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create a function to apply the trigger to all existing tables
    await setupClient.query(`
      CREATE OR REPLACE FUNCTION apply_size_check_to_all_tables() RETURNS void AS $$
      DECLARE
        tbl text;
      BEGIN
        FOR tbl IN 
          SELECT table_schema || '.' || table_name
          FROM information_schema.tables
          WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            AND table_type = 'BASE TABLE'
        LOOP
          PERFORM create_size_check_trigger_for_table(tbl);
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Apply the trigger to all existing tables
    await setupClient.query(`SELECT apply_size_check_to_all_tables()`);

    // Set up event trigger for future table creations
    await setupClient.query(`
      CREATE OR REPLACE FUNCTION create_size_check_trigger_event() RETURNS EVENT_TRIGGER AS $$
      DECLARE
        obj record;
      BEGIN
        FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE TABLE'
        LOOP
          PERFORM create_size_check_trigger_for_table(obj.object_identity);
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;

      DROP EVENT TRIGGER IF EXISTS create_size_check_trigger_event;
      CREATE EVENT TRIGGER create_size_check_trigger_event
      ON ddl_command_end
      WHEN TAG IN ('CREATE TABLE')
      EXECUTE FUNCTION create_size_check_trigger_event();
    `);

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error in setupDatabase:', error);
    throw error;
  } finally {
    await setupClient.end();
  }
}

async function createDatabase() {
  console.log('Attempting to create database...'); // Add this line for debugging
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  try {
    const dbName = `db_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const username = `user_${dbName}`;
    const password = generatePassword();

    // Create the database and user
    await client.query(`CREATE DATABASE ${dbName}`);
    await client.query(`CREATE USER ${username} WITH PASSWORD '${password}'`);
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${username}`);

    console.log('Database and user created successfully');

    // Now set up the database
    await setupDatabase(dbName, username);

    const encodedPassword = encodeURIComponent(password);
    const connectionUrl = `postgres://${username}:${encodedPassword}@${
      process.env.DB_HOST || 'localhost'
    }:${process.env.DB_PORT || '5432'}/${dbName}`;

    return { dbName, username, password, connectionUrl };
  } catch (error) {
    console.error('Error in createDatabase:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function executeQuery(dbName, username, password, query, params = []) {
  const pool = await getPool(dbName, username, password);
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
}

async function getDatabaseSize(dbName, username, password) {
  const result = await executeQuery(
    dbName,
    username,
    password,
    'SELECT pg_size_pretty(pg_database_size(current_database()))'
  );
  return result.rows[0].pg_size_pretty;
}

module.exports = { createDatabase, executeQuery, getDatabaseSize };
