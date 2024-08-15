#!/bin/bash

find_pgbouncer_container() {
    docker ps --format '{{.Names}}' | grep -i pgbouncer-create-postgresql | head -n 1
}


echo "Starting cleanup script at $(date)"

# Source the environment variables
source /etc/environment

echo "POSTGRES_PASSWORD is set: ${POSTGRES_PASSWORD:+yes}"

# First, get the list of databases to drop
DATABASES_TO_DROP=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U postgres -d postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'db_%'")

# Then, get the list of users to drop
USERS_TO_DROP=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U postgres -d postgres -t -c "SELECT rolname FROM pg_roles WHERE rolname LIKE 'user_db_%'")

# Disconnect all other connections
PGPASSWORD=$POSTGRES_PASSWORD psql -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U postgres -d postgres << EOF
DO \$\$
DECLARE
    db_name TEXT;
BEGIN
    FOR db_name IN (SELECT datname FROM pg_database WHERE datname LIKE 'db_%')
    LOOP
        -- Terminate all connections to the database
        PERFORM pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = db_name AND pid <> pg_backend_pid();
    END LOOP;
END \$\$;
EOF

# Drop each database
for DB in $DATABASES_TO_DROP
do
    echo "Dropping database: $DB"
    PGPASSWORD=$POSTGRES_PASSWORD psql -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U postgres -d postgres -c "DROP DATABASE IF EXISTS \"$DB\""
done

# Drop each user and remove from PgBouncer
for USER in $USERS_TO_DROP
do
    echo "Dropping user: $USER"
    PGPASSWORD=$POSTGRES_PASSWORD psql -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U postgres -d postgres -c "DROP USER IF EXISTS \"$USER\""
    
    # Remove user from PgBouncer userlist
    cat <(sed "/^\"$USER\"/d" /etc/pgbouncer/userlist.txt) > /etc/pgbouncer/userlist.txt
done

# Signal PgBouncer to reload its configuration
PGBOUNCER_CONTAINER=$(find_pgbouncer_container)
if [ -n "$PGBOUNCER_CONTAINER" ]; then
    if docker exec "$PGBOUNCER_CONTAINER" pkill -HUP pgbouncer; then
        echo "PgBouncer reloaded successfully at $(date)"
    else
        echo "Failed to reload PgBouncer at $(date)"
    fi
else
    echo "PgBouncer container not found at $(date)"
fi

# List remaining databases (for verification)
echo "Remaining databases:"
PGPASSWORD=$POSTGRES_PASSWORD psql -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U postgres -d postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'db_%'"

echo "Database cleanup completed at $(date)"
