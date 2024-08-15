#!/bin/bash

# Read the password from the environment variable
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-defaultpassword}

# Generate the SCRAM-SHA-256 hash
SALT=$(openssl rand -base64 16)
ITERATIONS=4096
KEY=$(echo -n "${POSTGRES_PASSWORD}${SALT}" | openssl dgst -binary -sha256 | openssl base64)
SCRAM_HASH="SCRAM-SHA-256\$${ITERATIONS}:${SALT}\$${KEY}"

# Create the userlist.txt file
echo "\"postgres\" \"${SCRAM_HASH}\"" > /pgbouncer/userlist.txt

echo "userlist.txt generated successfully."
