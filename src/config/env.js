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
    // Production bắt buộc set ADMIN_PASSWORD (fail-fast nếu thiếu) để không seed
    // admin bằng mật khẩu mặc định công khai. Dev cho default để chạy local tiện.
    password: optional('NODE_ENV') === 'production'
      ? required('ADMIN_PASSWORD')
      : optional('ADMIN_PASSWORD', 'ChangeMe123!'),
  },
};
