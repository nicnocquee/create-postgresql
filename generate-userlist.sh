#!/bin/bash

# Read the password from the environment variable
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-defaultpassword}

# Path to the userlist.txt file
USERLIST_FILE="/pgbouncer/userlist.txt"

# Check if the file exists and if it contains a postgres user
if [ ! -f "$USERLIST_FILE" ] || ! grep -q '"postgres"' "$USERLIST_FILE"; then
    # Generate the SCRAM-SHA-256 hash
    SALT=$(openssl rand -base64 16)
    ITERATIONS=4096
    KEY=$(echo -n "${POSTGRES_PASSWORD}${SALT}" | openssl dgst -binary -sha256 | openssl base64)
    SCRAM_HASH="SCRAM-SHA-256\$${ITERATIONS}:${SALT}\$${KEY}"

    # Create or append to the userlist.txt file
    echo "\"postgres\" \"${SCRAM_HASH}\"" >> "$USERLIST_FILE"

    echo "postgres user added to userlist.txt successfully."
else
    echo "postgres user already exists in userlist.txt. No changes made."
fi
