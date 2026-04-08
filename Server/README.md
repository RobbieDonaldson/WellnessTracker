# WellnessTracker Server

Express + MongoDB backend API for the WellnessTracker application.

## Tech Stack

- **Runtime**: Node.js 22 LTS
- **Framework**: Express 4.21
- **Database**: MongoDB with Mongoose 8.9 ODM
- **Architecture**: MVC (Models → Controllers → Routes)

## Prerequisites

- Node.js 22+ installed
- MongoDB running locally on port 27017 (or update `MONGO_URI` in `.env`)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start in development (with auto-reload)
npm run dev

# Start in production
npm start
```

The server starts on `http://localhost:5000` by default.

## Project Structure

```
Server/
├── config/
│   └── db.js                # MongoDB connection
├── controllers/
│   ├── activityController.js
│   ├── goalController.js
│   ├── mealController.js
│   └── sleepController.js
├── middleware/
│   └── errorHandler.js      # Centralized error handling
├── models/
│   ├── Activity.js
│   ├── Goal.js
│   ├── Meal.js
│   └── Sleep.js
├── routes/
│   ├── activityRoutes.js
│   ├── goalRoutes.js
│   ├── mealRoutes.js
│   └── sleepRoutes.js
├── views/
│   └── index.ejs            # EJS view engine template
├── .env.example
├── package.json
├── README.md
└── server.js                # Entry point
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activities` | List all activities |
| POST | `/api/activities` | Create an activity |
| GET | `/api/activities/:id` | Get activity by ID |
| PUT | `/api/activities/:id` | Update an activity |
| DELETE | `/api/activities/:id` | Delete an activity |
| GET | `/api/meals` | List all meals |
| POST | `/api/meals` | Create a meal |
| GET | `/api/meals/:id` | Get meal by ID |
| PUT | `/api/meals/:id` | Update a meal |
| DELETE | `/api/meals/:id` | Delete a meal |
| GET | `/api/sleep` | List all sleep records |
| POST | `/api/sleep` | Create a sleep record |
| GET | `/api/sleep/:id` | Get sleep record by ID |
| PUT | `/api/sleep/:id` | Update a sleep record |
| DELETE | `/api/sleep/:id` | Delete a sleep record |
| GET | `/api/goals` | List all goals |
| POST | `/api/goals` | Create a goal |
| GET | `/api/goals/:id` | Get goal by ID |
| PUT | `/api/goals/:id` | Update a goal |
| DELETE | `/api/goals/:id` | Delete a goal |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGO_URI` | `mongodb://localhost:27017/wellnesstracker` | MongoDB connection string |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
