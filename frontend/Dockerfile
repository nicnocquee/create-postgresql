FROM nginx:alpine

# Install envsubst
RUN apk add --no-cache gettext curl

# Copy the template HTML file
COPY index.html.template /usr/share/nginx/html/index.html.template

# Copy the nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the startup script
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

EXPOSE 80

# Use the startup script as the entry point
CMD ["/startup.sh"]
