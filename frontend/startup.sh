#!/bin/sh

# Replace the environment variables in the HTML file
envsubst < /usr/share/nginx/html/index.html.template > /usr/share/nginx/html/index.html

# Start nginx
nginx -g 'daemon off;'
