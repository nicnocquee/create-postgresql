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
    const connectionString = `${process.env.POSTGRES_INTERNAL_DATABASE_URL.split('/')
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
  const setupConnectionString = `${process.env.POSTGRES_INTERNAL_DATABASE_URL.split('/')
    .slice(0, -1)
    .join('/')}/${dbName}`;
  const setupClient = new Client({
    connectionString: setupConnectionString,
  });
  await setupClient.connect();

  console.log(`Setting up database: ${dbName} for user: ${username}`);

  try {
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

    // Set up a function to create the size check trigger for a table
    await setupClient.query(`
      CREATE OR REPLACE FUNCTION create_size_check_trigger(table_name text) RETURNS void AS $$
      BEGIN
        EXECUTE format('
          CREATE TRIGGER check_size_trigger
          AFTER INSERT OR UPDATE OR DELETE ON %I
          FOR EACH STATEMENT
          EXECUTE FUNCTION check_database_size()',
          table_name
        );
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create a function that will be called after table creation
    await setupClient.query(`
      CREATE OR REPLACE FUNCTION after_create_table() RETURNS EVENT_TRIGGER AS $$
      DECLARE
        obj record;
      BEGIN
        FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE TABLE'
        LOOP
          PERFORM create_size_check_trigger(obj.object_identity::regclass::text);
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create an event trigger that calls the after_create_table function
    await setupClient.query(`
      DROP EVENT TRIGGER IF EXISTS after_create_table_trigger;
      CREATE EVENT TRIGGER after_create_table_trigger
      ON ddl_command_end
      WHEN TAG IN ('CREATE TABLE')
      EXECUTE FUNCTION after_create_table();
    `);

    console.log(`Database setup completed for ${dbName}`);
  } catch (error) {
    console.error('Error in setupDatabase:', error);
    throw error;
  } finally {
    await setupClient.end();
  }
}

async function createDatabase() {
  const client = new Client({
    connectionString: process.env.POSTGRES_INTERNAL_DATABASE_URL,
  });
  await client.connect();

  const dbName = `db_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const username = `user_${dbName}`;
  const password = generatePassword();
  let newDbClient = null;

  try {
    console.log(`Creating database: ${dbName}`);
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database created: ${dbName}`);

    // Disconnect from the default database and connect to the new one
    await client.end();
    newDbClient = new Client({
      connectionString: `${process.env.POSTGRES_INTERNAL_DATABASE_URL.split('/')
        .slice(0, -1)
        .join('/')}/${dbName}`,
    });
    await newDbClient.connect();

    // Start a transaction for user creation and privilege granting
    await newDbClient.query('BEGIN');

    console.log(`Creating user: ${username}`);
    await newDbClient.query(`CREATE USER ${username} WITH PASSWORD '${password}'`);
    console.log(`User created: ${username}`);

    console.log(`Granting privileges to ${username} on ${dbName}`);
    await newDbClient.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${username}`);
    await newDbClient.query(`GRANT ALL PRIVILEGES ON SCHEMA public TO ${username}`);
    await newDbClient.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${username}`
    );
    await newDbClient.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${username}`
    );
    await newDbClient.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ${username}`
    );
    console.log(`Privileges granted to ${username} on ${dbName}`);

    // Verify user creation
    const userCheck = await newDbClient.query(`SELECT 1 FROM pg_roles WHERE rolname=$1`, [
      username,
    ]);
    if (userCheck.rows.length === 0) {
      throw new Error(`User ${username} was not created successfully`);
    } else {
      console.log(`User ${username} created successfully`);
      console.log(userCheck);
    }

    await newDbClient.query('COMMIT');

    // Now set up the database
    await setupDatabase(dbName, username);

    const encodedPassword = encodeURIComponent(password);
    const connectionUrl = `postgres://${username}:${encodedPassword}@${
      process.env.BACKEND_PUBLIC_DB_HOST || 'localhost'
    }:${process.env.BACKEND_PUBLIC_DB_PORT || '5432'}/${dbName}`;

    return { dbName, username, password, connectionUrl };
  } catch (error) {
    console.error('Error in createDatabase:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error.detail);

    if (newDbClient) {
      await newDbClient.query('ROLLBACK');
    }

    throw error;
  } finally {
    if (newDbClient) {
      await newDbClient.end();
    }
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
