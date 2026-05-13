require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name, defaultValue) {
  return process.env[name] ?? defaultValue;
}

module.exports = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', 3000)),
  dbPath: optional('DB_PATH', './data/app.db'),
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },
  bcrypt: {
    rounds: Number(optional('BCRYPT_ROUNDS', 10)),
  },
  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: optional('CLOUDINARY_API_KEY', ''),
    apiSecret: optional('CLOUDINARY_API_SECRET', ''),
  },
  seedAdmin: {
    username: optional('ADMIN_USERNAME', 'admin'),
    password: optional('ADMIN_PASSWORD', 'ChangeMe123!'),
  },
};
