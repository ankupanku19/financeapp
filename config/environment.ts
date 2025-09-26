// Environment Configuration
export const ENV_CONFIG = {
  API_BASE_URL: 'https://financeapp-77na.onrender.com/api',
  APP_NAME: 'Finance Tracker',
  APP_VERSION: '1.0.0',
  DEBUG_MODE: false,
  LOG_LEVEL: 'info',
  FEATURES: {
    AI_FEATURES: true,
    NOTIFICATIONS: true,
    ANALYTICS: true,
  },
} as const;
