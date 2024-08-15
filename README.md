# create-postgresql (WIP)

This repo contains the server part of [create-postgresql CLI](https://www.npmjs.com/package/create-postgresql). By default, the published version of the CLI uses the deployed version of this service. You can self host the backend services in this repo and use it with the CLI.

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
- [CLI tool to quickly generate a temporary database](https://www.npmjs.com/package/create-postgresql)

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
|   └── admin-tasks.sql
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

2. Copy `env.example` to `.env` and add your own values.

3. Build and start the containers:

   ```
   cp docker-compose.override.yml.example docker-compose.override.ym
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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
