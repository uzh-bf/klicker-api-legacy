require('dotenv').config()
const convict = require('convict')

module.exports = convict({
  app: {
    gzip: {
      default: true,
      env: 'APP_GZIP',
      format: Boolean,
    },
    port: {
      default: 3000,
      env: 'APP_PORT',
      format: 'port',
    },
    secret: {
      default: undefined,
      env: 'APP_SECRET',
      format: String,
    },
    trustProxy: {
      default: false,
      env: 'APP_TRUST_PROXY',
      format: Boolean,
    },
  },
  cache: {
    redis: {
      enabled: {
        default: false,
        env: 'CACHE_REDIS_ENABLED',
        format: Boolean,
      },
      host: {
        default: undefined,
        env: 'CACHE_REDIS_HOST',
        format: String,
      },
      password: {
        default: undefined,
        env: 'CACHE_REDIS_PASSWORD',
        format: String,
        sensitive: true,
      },
      port: {
        default: 6379,
        env: 'CACHE_REDIS_PORT',
        format: 'port',
      },
    },
  },
  env: {
    arg: 'nodeEnv',
    default: 'development',
    env: 'NODE_ENV',
    format: ['production', 'development', 'test'],
  },
  mongo: {
    database: {
      default: 'klicker',
      env: 'MONGO_DATABASE',
      format: String,
    },
    debug: {
      default: false,
      env: 'MONGO_DEBUG',
      format: Boolean,
    },
    url: {
      default: undefined,
      env: 'MONGO_URL',
      format: 'url',
    },
    user: {
      default: undefined,
      env: 'MONGO_USER',
      format: String,
    },
    password: {
      default: undefined,
      env: 'MONGO_PASSWORD',
      format: String,
    },
  },
  s3: {
    rootUrl: {
      default: undefined,
      env: 'S3_ROOT_URL',
      format: 'url',
    },
  },
  security: {
    cors: {
      credentials: {
        default: true,
        env: 'SECURITY_CORS_CREDENTIALS',
        format: Boolean,
      },
      origin: {
        default: 'localhost:4000',
        env: 'SECURITY_CORS_ORIGIN',
        format: 'url',
      },
    },
    expectCt: {
      enabled: {
        default: true,
        env: 'SECURITY_EXPECT_CT_ENABLED',
        format: Boolean,
      },
      enforce: {
        default: false,
        env: 'SECURITY_EXPECT_CT_ENFORCE',
        format: Boolean,
      },
      maxAge: {
        default: 0,
        env: 'SECURITY_EXPECT_CT_MAX_AGE',
        format: 'int',
      },
      reportUri: {
        default: undefined,
        env: 'SECURITY_EXPECT_CT_REPORT_URI',
        format: 'url',
      },
    },
    frameguard: {
      ancestors: {
        default: ["'none'"],
        env: 'SECURITY_FRAMEGUARD_ANCESTORS',
        format: Array,
      },
      enabled: {
        default: false,
        env: 'SECURITY_FRAMEGUARD_ENABLED',
        format: Boolean,
      },
    },
    hsts: {
      enabled: {
        default: false,
        env: 'SECURITY_HSTS_ENABLED',
        format: Boolean,
      },
      includeSubdomains: {
        default: false,
        env: 'SECURITY_HSTS_INCLUDE_SUBDOMAINS',
        format: Boolean,
      },
      maxAge: {
        default: 0,
        env: 'SECURITY_HSTS_MAX_AGE',
        format: 'nat',
      },
      preload: {
        default: undefined,
        env: 'SECURITY_HSTS_PRELOAD',
        format: Boolean,
      },
    },
    rateLimit: {
      delayAfter: {
        default: 200,
        env: 'SECURITY_RATE_LIMIT_DELAY_AFTER',
        format: 'nat',
      },
      delayMs: {
        default: 50,
        env: 'SECURITY_RATE_LIMIT_DELAY_MS',
        format: 'nat',
      },
      enabled: {
        default: true,
        env: 'SECURITY_RATE_LIMIT_ENABLED',
        format: Boolean,
      },
      max: {
        default: 1000,
        env: 'SECURITY_RATE_LIMIT_MAX',
        format: 'nat',
      },
      windowMs: {
        default: 5 * 60 * 1000,
        env: 'SECURITY_RATE_LIMIT_WINDOW_MS',
        format: 'nat',
      },
    },
  },
  services: {
    // Elastic APM
    apm: {
      enabled: {
        default: false,
        env: 'SERVICES_APM_ENABLED',
        format: Boolean,
      },
      monitorDev: {
        default: false,
        env: 'SERVICES_APM_DEV',
        format: Boolean,
      },
      secretToken: {
        default: undefined,
        env: 'SERVICES_APM_SECRET_TOKEN',
        format: String,
        sensitive: true,
      },
      serverUrl: {
        default: undefined,
        env: 'SERVICES_APM_SERVER_URL',
        format: 'url',
      },
      serviceName: {
        default: undefined,
        env: 'SERVICES_APM_SERVICE_NAME',
        format: String,
      },
    },
    sentry: {
      enabled: {
        default: false,
        env: 'SERVICES_SENTRY_ENABLED',
        format: Boolean,
      },
      dsn: {
        default: undefined,
        env: 'SERVICES_SENTRY_DSN',
        format: 'url',
      },
    },
  },
})
