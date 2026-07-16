# Shift Handover Summarizer

An AI-powered web application that turns Siemens Dahod locomotive-plant shift notes into a clean, structured handover summary for the incoming team.

Floor operators type their free-text shift notes, and the app automatically extracts and categorises key information — pending tasks, equipment issues, safety observations, material shortages, priorities, and affected loco units — in seconds.

## Tech stack

- React with Vite and plain CSS
- Node.js with Express
- MySQL
- Groq API (`llama-3.1-8b-instant`)
- axios, cors, dotenv, and mysql2

## Prerequisites

- Node.js 18 or later
- MySQL running locally (XAMPP / WAMP / native)
- A Groq API key from [console.groq.com](https://console.groq.com) — free, no credit card required

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

   Using phpMyAdmin:
   - Open `http://localhost/phpmyadmin`
   - Click **New** → name it `shift_handover` → click **Create**
   - Select the database → click the **SQL** tab
   - Paste the contents of `server/schema.sql` → click **Go**

   Using the terminal:
   ```bash
   mysql -u root -p < server/schema.sql
   ```

5. Copy the environment template and fill in your values:

   ```bash
   # Windows
   copy server\.env.example server\.env

   # macOS / Linux
   cp server/.env.example server/.env
   ```

   Open `server/.env` and set:
   ```dotenv
   GROQ_API_KEY=your_groq_key_here
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=shift_handover
   ```

6. Start the backend (keep this terminal open):

   ```bash
   cd server
   node index.js
   ```

   You should see: `Server running on port 3001`

7. In a second terminal, start the frontend:

   ```bash
   cd client
   npm run dev
   ```

   Open the localhost URL printed by Vite (usually `http://localhost:5173`).

## How to get a Groq API key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google or GitHub — no credit card needed
3. Click **API Keys** in the left sidebar → **Create API Key**
4. Copy the key into `server/.env` as `GROQ_API_KEY`

Free tier: 14,400 requests/day — more than enough for development and demo use.

## Curl test

With MySQL running, the server started, and a valid Groq key in `.env`, run this to verify the full pipeline:

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

Expected response:
```json
{
  "success": true,
  "summary": {
    "pending_tasks": ["..."],
    "equipment_issues": ["..."],
    "safety_observations": [],
    "material_shortages": ["..."],
    "priorities": ["..."],
    "loco_units_affected": ["WDG4-112", "WDG4-113"]
  }
}
```

## What the AI extracts

| Field | Description |
|---|---|
| 🔴 Priorities | Top 2–3 urgent actions for the incoming shift |
| ⏳ Pending Tasks | Incomplete work carrying over from this shift |
| 🔧 Equipment Issues | Machines or tools with faults or breakdowns |
| ⚠️ Safety Observations | Incidents, near-misses, injuries, or hazards |
| 📦 Material Shortages | Parts or consumables that are low or out of stock |
| 🚂 Locos Affected | Locomotive unit numbers mentioned with issues |

## Sections supported

Assembly Line A, Assembly Line B, Maintenance Bay, Wheel Shop, Electrical Section, Paint & Finishing, Loco Testing Track, Stores & Material, Quality Control

## Sample test notes

Ten synthetic shift notes covering realistic plant scenarios are included in `server/data/sample_notes.json` — machine breakdowns, safety incidents, material shortages, staff absenteeism, emergency breakdowns, and quality issues. Use them to test the AI extraction pipeline.

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `ECONNREFUSED 3306` | MySQL not running | Start MySQL from XAMPP/WAMP control panel |
| `Access denied for user 'root'` | Wrong password in `.env` | Fix `DB_PASSWORD` |
| `Unknown database 'shift_handover'` | Schema not run yet | Run `schema.sql` in phpMyAdmin or terminal |
| `Cannot find module 'express'` | npm install not run | Run `npm install` in `server/` |
| `GROQ_API_KEY is missing` | Key not set in `.env` | Add key and restart server |
| CORS error in browser | Middleware missing | Ensure `app.use(cors())` is before routes in `index.js` |

## Folder structure

```
client/
  index.html              Vite HTML entry point
  src/
    main.jsx              React bootstrap file
    App.jsx               Complete single-page frontend and styles
server/
  index.js                Express API and routes
  summarizer.js           Groq API call and JSON validation
  db.js                   MySQL connection pool
  schema.sql              Database and table creation script
  .env.example            Required environment-variable template
  data/
    sample_notes.json     Ten synthetic notes for testing
README.md                 Project setup and usage guide
```

## Security notes

- `.env` is listed in `.gitignore` and will not be committed to Git
- Never commit your `GROQ_API_KEY` or database password
- Use `.env.example` as a safe reference template — it contains no real credentials

## Future Scope:

1. complete time sheet along with overtime request and approval via email only.
2. unique identofication and passwords name employee code date and time.
3. tool box checklists and approval method. 
4. login page with admin protocols (security layer)