# create-postgresql (WIP)

A command-line interface (CLI) tool to quickly create a temporary PostgreSQL database for development purposes.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [How It Works](#how-it-works)
- [Development](#development)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)

## Installation

You can install `create-postgresql` globally using npm:

```bash
npm install -g create-postgresql
```

## Usage

After installation, you can run the CLI tool using the following command:

```bash
create-postgresql
```

This will start the process of creating a temporary PostgreSQL database.

## Options

The CLI supports several command-line options:

- `--api-url, -a`: Backend API URL (default: {{API_URL}})
- `--frontend-url, -f`: Frontend URL (default: {{FRONTEND_URL}})
- `--poll-interval, -p`: Polling interval in milliseconds (default: {{POLL_INTERVAL}} or 2000)
- `--max-attempts, -m`: Maximum poll attempts (default: {{MAX_POLL_ATTEMPTS}} or 30)

Example usage with options:

```bash
create-postgresql --api-url https://api.example.com --frontend-url https://app.example.com
```

## How It Works

1. When you run the command, it generates a unique session ID.
2. It opens a verification URL in your default browser.
3. The CLI waits for you to complete the verification process.
4. Once verified, it creates a temporary PostgreSQL database.
5. Finally, it displays the database credentials and connection information.

## Development

To set up the project for development:

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/create-postgres.git
   cd create-postgres
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development version:
   ```bash
   npm run dev
   ```

## Dependencies

- [axios](https://github.com/axios/axios): Promise-based HTTP client for making API requests
- [open](https://github.com/sindresorhus/open): Opens URLs in the user's preferred browser
- [yargs](https://github.com/yargs/yargs): Command-line argument parser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).
