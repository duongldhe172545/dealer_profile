const bcrypt = require('bcrypt');
const env = require('../config/env');

function hash(plain) {
  return bcrypt.hash(plain, env.bcrypt.rounds);
}

function verify(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, verify };
