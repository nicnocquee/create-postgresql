FROM alpine:latest

# Install necessary packages
RUN apk add --no-cache inotify-tools docker-cli

# Create necessary directories
RUN mkdir -p /etc/pgbouncer /var/lib/pgbouncer

COPY update-pgbouncer.sh /update-pgbouncer.sh
RUN chmod +x /update-pgbouncer.sh

CMD ["/update-pgbouncer.sh"]
