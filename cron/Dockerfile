FROM postgres:15

# Install cron, procps, and docker client
RUN apt-get update && apt-get install -y cron procps apt-transport-https ca-certificates curl gnupg lsb-release
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
RUN echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update && apt-get install -y docker-ce-cli

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
