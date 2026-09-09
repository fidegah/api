export default () => ({
  app: { domain: process.env.APP_DOMAIN },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    form: process.env.MAIL_FROM,
  },
  otp: {
    secret: process.env.OTP_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL,
  },
  storage: {
    endpoint: process.env.ARVAN_S3_ENDPOINT,
    region: process.env.ARVAN_S3_REGION,
    accessKeyId: process.env.ARVAN_S3_ACCESS_KEY,
    secretAccessKey: process.env.ARVAN_S3_SECRET_KEY,
    privateBucket: process.env.ARVAN_S3_PRIVATE_BUCKET,
    publicBucket: process.env.ARVAN_S3_PUBLIC_BUCKET,
  },
});
