const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const authRoute = require('./routes/auth.route');
const productRoute = require('./routes/product.route');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// app.js only sets up the Express app — no DB connection, no dotenv.
// This lets tests import the app directly without side effects like
// connecting to a real database or reading a .env file.
const app = express();

// helmet sets secure HTTP response headers automatically (e.g. prevents
// browsers from sniffing MIME types, stops clickjacking, disables caching
// of sensitive pages). One line replaces ~10 manual header settings.
app.use(helmet());

// cors allows browsers from other origins (e.g. your React frontend on
// localhost:5173) to make requests to this API. Without it, browsers
// block cross-origin requests by default.
app.use(cors());

// morgan logs each incoming request (method, URL, status, response time)
// in the terminal so you can see what's happening while developing.
// Skipped in production to avoid noisy log files.
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting stops a single IP from hammering the API (e.g. a bot
// trying thousands of passwords). 100 requests per 15 minutes is
// generous for real users but blocks automated abuse.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
);

// express.json() parses incoming request bodies sent as JSON so that
// req.body is available. The 10kb limit prevents someone from sending
// a massive payload to crash or slow down the server.
app.use(express.json({ limit: '10kb' }));

// express.urlencoded() parses form-encoded bodies (e.g. from HTML forms).
// extended: false uses the simpler querystring library instead of qs.
app.use(express.urlencoded({ extended: false }));

// Root route — minimal response to confirm the server is alive.
app.get('/', (req, res) => res.json({ status: 'ok' }));

// /health is used by Kubernetes liveness and readiness probes, and by Docker's
// HEALTHCHECK instruction. Keeping it separate from '/' means you can route
// probe traffic differently (e.g. exclude it from access logs) without
// affecting the root endpoint.
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount routers at their base paths. All routes inside authRoute will
// be prefixed with /api/auth, and productRoute with /api/products.
app.use('/api/auth', authRoute);
app.use('/api/products', productRoute);

// notFound must come after all routes so it only fires when no route matched.
// errorHandler must be last because Express identifies error-handling
// middleware by its 4-parameter signature (err, req, res, next).
app.use(notFound);
app.use(errorHandler);

module.exports = app;
