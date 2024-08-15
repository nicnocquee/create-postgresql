#!/bin/sh

USERLIST_FILE="/etc/pgbouncer/userlist.txt"
NEW_USERS_FILE="/var/lib/pgbouncer/new_users.txt"

while true; do
    if [ -f "$NEW_USERS_FILE" ]; then
        echo "New users file found. Updating userlist..."
        cat "$NEW_USERS_FILE" >> "$USERLIST_FILE"
        echo "Updated userlist contents:"
        cat "$USERLIST_FILE"
        rm "$NEW_USERS_FILE"
        echo "Reloading PgBouncer..."
        if docker exec pgbouncer pkill -HUP pgbouncer; then
            echo "PgBouncer reloaded successfully at $(date)"
        else
            echo "Failed to reload PgBouncer at $(date)"
        fi
    fi
    sleep 1
done
