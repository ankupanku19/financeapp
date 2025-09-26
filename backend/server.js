const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const incomeRoutes = require('./routes/income');
const savingsRoutes = require('./routes/savings');
const goalsRoutes = require('./routes/goals');
const categoriesRoutes = require('./routes/categories');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const notificationsRoutes = require('./routes/notifications');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const NotificationScheduler = require('./services/NotificationScheduler');

const app = express();

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ankupanku1910_db_user:P8Nkdeq1iZcSmiqG@financeapp.0b9mzqv.mongodb.net/';
const isDevelopment = NODE_ENV === 'development';

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration - Allow all origins for mobile app development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins for now to fix mobile app issues
    // In production, you can restrict this to specific domains
    return callback(null, true);
    
    // Original restrictive logic (commented out for now)
    /*
    const allowedOrigins = isDevelopment
      ? [
          'http://localhost:8081',
          'http://localhost:3000',
          'exp://localhost:8081',
          'http://192.168.1.9:8081',
          'exp://192.168.1.9:8081',
          'exp://192.168.1.9:19000',
          'exp://192.168.1.9:19001',
          'exp://192.168.1.9:19002',
          true
        ]
      : [
          process.env.FRONTEND_URL,
          'https://financeapp-77na.onrender.com',
          /^exp:\/\/.*$/,
          /^http:\/\/192\.168\.\d+\.\d+:.*$/,
          /^http:\/\/10\.\d+\.\d+\.\d+:.*$/,
          /^http:\/\/172\.\d+\.\d+\.\d+:.*$/
        ];
    
    if (allowedOrigins.includes(true) || allowedOrigins.some(pattern => 
      typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
    */
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: '1.0.0',
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit:', {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    method: req.method,
    url: req.url
  });
  
  res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    environment: NODE_ENV,
  });
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Root endpoint to handle 404s
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Finance Tracker API Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      test: '/api/test',
      auth: '/api/auth',
      api: '/api'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  // Initialize notification scheduler
  const notificationScheduler = new NotificationScheduler();
  notificationScheduler.start();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Server running in ${NODE_ENV} mode
📡 Listening on port ${PORT} (all interfaces)
🌐 API available at:
   - http://localhost:${PORT}/api
   - http://192.168.1.9:${PORT}/api
📊 Health check at:
   - http://localhost:${PORT}/health
   - http://192.168.1.9:${PORT}/health
🔔 Notification scheduler started
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  return server;
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = app;