# MagicListener

A Node.js application for listening to live streams and managing real-time data using Ably messaging and database repositories.

## Features

- Real-time stream listening with Ably integration
- Shop and Weather data repositories
- Message service for processing and handling events
- Database persistence with configurable connection string

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Database (configured via `DATABASE_URL`)
- Ably account and API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MagicListener
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your configuration:
```
API_STREAM_URL=<your-api-stream-url>
ABLY_API_KEY=<your-ably-api-key>
DATABASE_URL=<your-database-connection-string>
```

## Project Structure

```
src/
├── index.js                  # Application entry point
├── StreamListener.js         # Stream listening logic
├── db/
│   └── index.js             # Database connection and setup
├── Repositories/
│   ├── ShopRepository.js     # Shop data repository
│   └── WeatherRepository.js  # Weather data repository
└── Services/
    └── MessageService.js    # Message processing service
```

## Usage

Start the application:
```bash
npm start
```

The application will:
1. Connect to the API stream using the provided stream URL
2. Listen for real-time events via Ably
3. Process and store data using the repositories
4. Handle messages through the MessageService

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `API_STREAM_URL` | The API endpoint for the live stream | `https://api.example.com/live/stream` |
| `ABLY_API_KEY` | Ably API key for real-time messaging | `your-ably-api-key` |
| `DATABASE_URL` | Database connection string | `postgresql://user:pass@localhost:5432/magiclistener` |

## License

MIT
