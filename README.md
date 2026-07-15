# Shift Handover Summarizer

An AI-powered web application that turns Siemens Dahod locomotive-plant shift notes into a clear handover for the incoming team.

## Tech stack

- React with Vite and plain CSS
- Node.js with Express
- MySQL
- Google Gemini API (`gemini-1.5-flash`)
- axios, cors, dotenv, and mysql2

## Prerequisites

- Node.js 18 or later
- MySQL running locally
- A Gemini API key from [Google AI Studio](https://aistudio.google.com) (sign in, select **Get API Key**, then create a key)

## Setup

1. Clone or download this project.
2. Install backend packages:

   ```bash
   cd server
   npm install
   ```

3. Install frontend packages:

   ```bash
   cd ../client
   npm install
   ```

4. Create the database and tables by running [`server/schema.sql`](server/schema.sql) in MySQL.
5. Copy the environment template and add your values:

   ```bash
   cd ../server
   copy .env.example .env
   ```

   Set `GEMINI_API_KEY` and your MySQL credentials in `.env`. On macOS/Linux, use `cp .env.example .env` instead.
6. Start the backend:

   ```bash
   node index.js
   ```

   The terminal should show `Server running on port 3001`.
7. In another terminal, start the frontend:

   ```bash
   cd client
   npm run dev
   ```

   Open the localhost URL printed by Vite.

## Curl test

With MySQL, the server, and a valid Gemini key configured, run:

```bash
curl -X POST http://localhost:3001/api/handover \
  -H "Content-Type: application/json" \
  -d '{
    "operator_name": "Ramesh Patel",
    "shift_type": "morning",
    "section": "Assembly Line A",
    "raw_notes": "Completed bogie assembly for loco WDG4-112. Traction motor fitment pending on WDG4-113, waiting for motor from stores. Overhead crane C2 making noise, maintenance informed but not fixed. No safety issues. Priority: follow up on motor indent before afternoon shift."
  }'
```

## Folder structure

```
client/
  index.html                Vite HTML entry point
  src/main.jsx              React bootstrap file
  src/App.jsx               Complete single-page frontend and styles
server/
  index.js                  Express API and routes
  summarizer.js             Gemini HTTPS request and JSON validation
  db.js                     MySQL connection pool
  schema.sql                Database and table creation script
  .env.example              Required environment-variable template
  data/sample_notes.json    Ten synthetic notes for testing
README.md                   Project setup and usage guide
```

`.env` is intentionally ignored by Git. Do not commit your Gemini API key or database password.
