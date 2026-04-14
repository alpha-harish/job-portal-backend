const required = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLIENT_URL',
  'NODE_ENV',
];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
};

validateEnv();

module.exports = validateEnv;
