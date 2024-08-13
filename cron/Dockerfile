FROM postgres:15

# Install cron and procps
RUN apt-get update && apt-get install -y cron procps

# Copy crontab file to the cron.d directory
COPY crontab /etc/cron.d/cleanup-cron

# Give execution rights on the cron job
RUN chmod 0644 /etc/cron.d/cleanup-cron

# Copy the cleanup script
COPY cleanup-script.sh /usr/local/bin/cleanup-script.sh
RUN chmod +x /usr/local/bin/cleanup-script.sh

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create the log file to be able to run tail
RUN touch /var/log/cron.log

# Set the entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Run the command on container startup
CMD ["cron", "-f", "&", "tail", "-f", "/var/log/cron.log"]
