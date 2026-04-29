// config/configuration.ts
export default () => ({
  // App
  port: parseInt(process.env.PORT, 10) || 4060,
  nodeEnv: process.env.NODE_ENV,
  frontendUrl: process.env.FRONTEND_URL,

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },

  // Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    botUsername: process.env.TELEGRAM_BOT_USERNAME,
  },

  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },

  // Payments
  payments: {
    stars: {
      enabled: true,
    },
    ton: {
      enabled: true,
    },
    local: {
      enabled: true,
      currency: 'ETB',
    },
  },
});
