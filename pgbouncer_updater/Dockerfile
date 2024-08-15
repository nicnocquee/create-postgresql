FROM alpine:latest

# Install necessary packages
RUN apk add --no-cache inotify-tools docker-cli

# Create necessary directories
RUN mkdir -p /etc/pgbouncer /var/lib/pgbouncer

COPY update_pgbouncer.sh /update_pgbouncer.sh
RUN chmod +x /update_pgbouncer.sh

CMD ["/update_pgbouncer.sh"]
