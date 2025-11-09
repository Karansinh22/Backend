# Community Services

This service handles community creation, posts, join requests, member roles, and related functionality.

## 🌐 Environment Setup

Before running the service, you need to set up the environment variables:

1. Copy the example environment file:
   ```bash
   cp .env.example .env.dev
   ```

2. Update the values in `.env.dev` as needed for your environment.

> Note: The service looks for `.env.dev` when running with `--env=dev` flag (which is the default for `npm run start:dev`).

## 🚀 Quick Start with Nodemon

For development, we use nodemon to automatically restart the server when code changes are detected.

### Install Dependencies
```bash
npm install
```

### Development Mode (with auto-restart)
```bash
npm run start:dev
```

This will start the server using nodemon, which will automatically restart when you make changes to any `.js` or `.json` files in the `src` directory.

> The service will automatically load environment variables from `.env.dev` and connect to the MongoDB database specified in the configuration.

### Production Mode
```bash
npm start
```

## 🛠️ Nodemon Configuration

The nodemon configuration is defined in `nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["src/**/*.test.js", "src/**/*.spec.js"],
  "delay": "1000"
}
```

This configuration:
- Watches all files in the `src` directory
- Restarts on changes to `.js` and `.json` files
- Ignores test files
- Adds a 1-second delay before restarting to avoid multiple restarts for bulk changes

## 📁 Project Structure

```
community-services/
├── src/
│   ├── config/           # DB config, constants, env
│   ├── console/          # CLI tools (seeders / cron triggers)
│   ├── controllers/      # Route handlers
│   ├── libs/             # 3rd party libs (S3, Redis, Mail, etc.)
│   ├── message/          # Error/success messages
│   ├── middleware/       # Auth, rate-limit, validators
│   ├── migrations/       # migrate-mongo files
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── utils/            # Helpers
│   ├── validations/      # Express-validator rules
│   └── index.js          # App entrypoint
├── package.json
└── .env.dev
```