FROM node:20

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y curl pgbouncer

# Create the directory for PgBouncer user files
RUN mkdir -p /var/lib/pgbouncer && chmod 777 /var/lib/pgbouncer

# Copy package.json and package-lock.json from the root directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the backend code
COPY backend ./backend

CMD ["node", "backend/server.js"]