# create-postgresql server

This repo contains the server part of [create-postgresql CLI](https://www.npmjs.com/package/create-postgresql). By default, the published version of the CLI uses the deployed version of this service. You can self host the backend services in this repo and use it with the CLI.

## System Overview

The system consists of several components:

- PostgreSQL database.
- PGBouncer connection pooler.
- Backend server (Node.js/Express).
- Frontend verification page: a single HTML page that uses Google reCAPTCHA to verify the user's identity.
- Cron job for database cleanup.
- [create-postgresql CLI to quickly generate a temporary database](https://www.npmjs.com/package/create-postgresql)
- TimescaleDB database to track number of created databases over time.

## Prerequisites

- Docker and Docker Compose
- Node.js and npm (for CLI tool development)
- Google reCAPTCHA account (for frontend verification)

## Development Setup

1. Clone the repository:

   ```
   git clone https://github.com/nicnocquee/create-postgresql.git
   cd create-postgresql
   ```

2. Copy `env.example` to `.env` and add your own values.

3. Build and start the containers:

   ```
   cp docker-compose.override.yml.example docker-compose.override.yml
   docker-compose up --build
   ```

4. The services will be available at:

   - Frontend: http://localhost
   - Backend API: http://localhost:3000

5. For CLI tool development:
   ```
   cd cli
   npm install
   npm link
   cd ..
   npm run cli # run the CLI tool against the local server
   ```

## Security Measures

- Each database is associated with a unique PostgreSQL user.
- Users can only access their own database.
- Public access to databases is revoked.
- Databases and their associated users are completely removed during the cleanup process.
- Each database user is assigned a strong, randomly generated password.

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch-name`
3. Make changes and commit: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-branch-name`
5. Submit a pull request

## Database Limitations

- Each database is limited to 10MB of storage.
- Attempts to exceed this limit will result in an error.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
