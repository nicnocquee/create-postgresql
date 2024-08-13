#!/bin/bash
set -e

# Write environment variables to /etc/environment
env | grep -v "^_" > /etc/environment

# Apply cron job
crontab /etc/cron.d/cleanup-cron

exec "$@"
