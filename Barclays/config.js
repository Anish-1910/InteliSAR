/**
 * Configuration Management
 * Loads and validates all environment variables
 */

require('dotenv').config();

const config = {
  // Server
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'barclays_aml',
    user: process.env.DB_USER || 'barclays_app',
    password: process.env.DB_PASSWORD || 'change_me_to_secure_password',
    ssl: process.env.DB_SSL === 'true',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // ML Service
  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://localhost:5000',
    timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '30000'),
  },

  // Processing Jobs
  jobs: {
    processIntervalSeconds: parseInt(process.env.PROCESS_INTERVAL_SECONDS || '5'),
    batchSize: parseInt(process.env.BATCH_SIZE || '100'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  },

  // Alerts
  alerts: {
    threshold: parseInt(process.env.ALERT_THRESHOLD || '90'),
    emailAlerts: process.env.EMAIL_ALERTS === 'true',
    emailRecipient: process.env.EMAIL_RECIPIENT || 'alerts@barclays.com',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Monitoring
  monitoring: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT || '9090'),
  },
};

// Validate critical configuration
function validateConfig() {
  const errors = [];

  if (!config.database.host) {
    errors.push('DB_HOST not configured');
  }
  if (!config.database.user) {
    errors.push('DB_USER not configured');
  }
  if (!config.mlService.url) {
    errors.push('ML_SERVICE_URL not configured');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }

  console.log('✓ Configuration validated');
}

module.exports = {
  config,
  validateConfig,
};
