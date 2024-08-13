# create-postgresql (WIP)

create-postgresql is a service that provides temporary PostgreSQL databases for developers. It offers a CLI tool for easy database creation and a daily reset mechanism to ensure fresh environments.

## Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Development Setup](#development-setup)
5. [Production Deployment](#production-deployment)
6. [CLI Tool Usage](#cli-tool-usage)
7. [API Endpoints](#api-endpoints)
8. [Database Cleanup](#database-cleanup)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)
11. [Contributing](#contributing)
12. [License](#license)

## System Overview

The system consists of several components:

- PostgreSQL database
- Backend server (Node.js/Express)
- Frontend verification page
- Cron job for database cleanup
- CLI tool for user interaction

## Prerequisites

- Docker and Docker Compose
- Node.js and npm (for CLI tool development)
- Google reCAPTCHA account (for frontend verification)

## Project Structure

```
project-root/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── database.js
├── frontend/
│   ├── Dockerfile
│   └── index.html
├── postgres/
│   └── init-script.sql
├── cron/
│   ├── Dockerfile
│   ├── crontab
│   └── cleanup-script.sh
└── cli/
    ├── package.json
    └── index.js
```

## Development Setup

1. Clone the repository:

   ```
   git clone https://github.com/nicnocquee/create-postgres.git
   cd create-postgres
   ```

2. Set up environment variables:
   Create a `.env` file in the project root and add:

   ```
   POSTGRES_PASSWORD=your_secure_password
   RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
   RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   ```

3. Build and start the containers:

   ```
   docker-compose up --build
   ```

4. The services will be available at:

   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432

5. For CLI tool development:
   ```
   cd cli
   npm install
   npm link
   ```

## Production Deployment

1. Set up a production server with Docker and Docker Compose installed.
2. Clone the repository on the server.
3. Set up environment variables as in the development setup, but use production-ready values. Ensure the `RECAPTCHA_SITE_KEY` is set to your production reCAPTCHA site key.
4. Update `docker-compose.yml`:

   - Remove port mappings for PostgreSQL
   - Add proper SSL termination for frontend and backend
   - Set up volume mounts for persistent data

5. Build and start the containers:

   ```
   docker-compose up -d --build
   ```

6. Set up monitoring and logging solutions (e.g., Prometheus, Grafana, ELK stack).

7. Implement a backup strategy for the PostgreSQL data.

## CLI Tool Usage

After setting up the CLI tool:

```
create-postgresql
```

This will initiate the database creation process, opening a browser for verification.

## API Endpoints

- POST `/verify`: Verify reCAPTCHA response
- POST `/create-database`: Create a new database (requires prior verification)
- GET `/verify-status`: Check verification status

Refer to `backend/server.js` for detailed implementation.

## Database Cleanup

Databases are automatically reset daily at midnight UTC. The cleanup process:

1. Identifies all databases prefixed with `db_`
2. Drops all tables in each identified database
3. Logs the cleanup process

To manually trigger a cleanup:

```
docker-compose exec cron /usr/local/bin/cleanup-script.sh
```

## Security Measures

- Each database is associated with a unique PostgreSQL user.
- Users can only access their own database.
- Public access to databases is revoked.
- Connection pooling is used with specific credentials for each database.
- Databases and their associated users are completely removed during the cleanup process.
- Each database user is assigned a strong, randomly generated password.
- Passwords are generated using cryptographically secure random number generation.

These measures ensure strong isolation between user databases and prevent unauthorized access.

## Troubleshooting

- **Database connection issues**: Ensure PostgreSQL container is running and credentials are correct.
- **reCAPTCHA failures**: Verify secret key and check reCAPTCHA dashboard for any issues.
- **Cleanup not working**: Check cron logs and ensure the cron container is running.

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch-name`
3. Make changes and commit: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-branch-name`
5. Submit a pull request

## Database Limitations

- Each database is limited to 10MB of storage.
- Attempts to exceed this limit will result in an error.
- Users can check their current database size through the API.

Please note that exceeding the size limit will prevent further data insertion or updates. Users should monitor their database size and manage their data accordingly.

## Abuse Prevention

This service implements several measures to prevent abuse:

- Rate limiting on database creation
- Resource quotas for each database
- 24-hour lifetime limit for databases
- Query monitoring and restrictions:
  - All queries are logged and analyzed for suspicious patterns
  - Users are restricted from performing certain operations (e.g., creating new tables)
  - Alerts are generated for potentially abusive query patterns
- Advanced reCAPTCHA implementation
- Clear Terms of Service

Users found to be violating our ToS or attempting to abuse the service will be banned.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
