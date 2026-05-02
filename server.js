// dotenv reads your .env file and loads the values into process.env
// so the rest of the app can use process.env.MONGO_URI, JWT_SECRET, etc.
// It must be called before anything else reads those variables.
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');

// Falls back to 3000 if PORT is not set in the environment.
const PORT = process.env.PORT || 3000;

// Connect to MongoDB first, then start listening for HTTP requests.
// This order ensures the database is ready before the first request arrives.
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    // If the database connection fails at startup, there is no point
    // running the server — log the reason and exit so the process
    // manager (e.g. PM2, Docker) can restart and alert you.
    console.error('Failed to connect to DB:', err.message);
    process.exit(1);
  });
