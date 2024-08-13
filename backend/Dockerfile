FROM node:14

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y curl

# Copy package.json and package-lock.json from the root directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the backend code
COPY backend ./backend

EXPOSE 3000

CMD ["node", "backend/server.js"]
